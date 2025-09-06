import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import { EnvelopeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface EmailVerificationProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

interface OtpFormData {
  otp: string;
}

const otpSchema = yup.object({
  otp: yup
    .string()
    .required('OTP is required')
    .length(6, 'OTP must be 6 digits')
    .matches(/^\d{6}$/, 'OTP must contain only numbers'),
});

export const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onSuccess,
  onBack,
}) => {
  const { verifyEmailOtp, resendOtp } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<OtpFormData>({
    resolver: yupResolver(otpSchema),
  });

  const onSubmit = async (data: OtpFormData) => {
    try {
      await verifyEmailOtp(email, data.otp);
      toast.success('Email verified successfully!');
      onSuccess();
    } catch (error: any) {
      if (error.response?.data?.error) {
        setError('otp', { message: error.response.data.error });
      } else {
        toast.error('Failed to verify OTP. Please try again.');
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      await resendOtp(email);
      toast.success('OTP sent successfully!');
      
      // Start cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8"
    >
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <EnvelopeIcon className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
        <p className="mt-2 text-sm text-gray-600">
          We've sent a 6-digit verification code to
        </p>
        <p className="font-medium text-gray-900">{email}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
            Verification Code
          </label>
          <input
            {...register('otp')}
            type="text"
            id="otp"
            placeholder="Enter 6-digit code"
            maxLength={6}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono tracking-widest ${
              errors.otp ? 'border-red-300' : 'border-gray-300'
            }`}
            autoComplete="one-time-code"
          />
          {errors.otp && (
            <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isResending}
                className="font-medium text-blue-600 hover:text-blue-500 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  'Sending...'
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  'Resend Code'
                )}
              </button>
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Registration
          </button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          The verification code will expire in 10 minutes.
        </p>
      </div>
    </motion.div>
  );
};
