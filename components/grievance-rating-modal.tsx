'use client';

import React, { useState } from 'react';
import { X, Star, Send, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: any;
  onRatingSubmitted: (updatedGrievance: any) => void;
}

export default function GrievanceRatingModal({ 
  isOpen, 
  onClose, 
  grievance, 
  onRatingSubmitted 
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/grievances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: grievance.id,
          satisfaction_rating: rating,
          feedback_on_resolution: feedback.trim() || null
        })
      });
      
      if (!response.ok) throw new Error('Failed to submit rating');
      
      const updatedGrievance = await response.json();
      onRatingSubmitted(updatedGrievance);
      toast.success('Thank you for your feedback!');
      onClose();
      
      // Reset form
      setRating(0);
      setHoveredRating(0);
      setFeedback('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className="focus:outline-none transition-colors"
        >
          <Star
            className={`w-8 h-8 ${
              starValue <= (hoveredRating || rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      );
    });
  };

  const getRatingText = (ratingValue: number) => {
    switch (ratingValue) {
      case 1: return 'Very Poor';
      case 2: return 'Poor';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Rate Resolution
              </h2>
              <p className="text-sm text-gray-500">
                How satisfied are you with the resolution?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Grievance Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{grievance?.subject}</h3>
            <p className="text-sm text-gray-600 mb-3">{grievance?.description}</p>
            
            {grievance?.resolution && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Resolution</span>
                </div>
                <p className="text-sm text-green-700">{grievance.resolution}</p>
                {grievance.resolved_at && (
                  <p className="text-xs text-green-600 mt-1">
                    Resolved on {formatDate(grievance.resolved_at)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Rating Form */}
          <form onSubmit={handleSubmitRating} className="space-y-6">
            {/* Star Rating */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Rate your satisfaction with the resolution
              </label>
              <div className="flex justify-center space-x-1 mb-2">
                {renderStars()}
              </div>
              <p className="text-sm text-gray-600">
                {getRatingText(hoveredRating || rating)}
              </p>
            </div>

            {/* Feedback Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional feedback (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us more about your experience..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Rating</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 