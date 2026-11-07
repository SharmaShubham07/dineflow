import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/ToastStore';
import { Star, MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  cafeName: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  orderId,
  cafeName,
}) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to local feedback store
    const feedbacks = JSON.parse(localStorage.getItem('dineflow_feedbacks') || '[]');
    feedbacks.push({
      orderId,
      rating,
      comment: feedback.trim(),
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('dineflow_feedbacks', JSON.stringify(feedbacks));

    setSubmitted(true);
    toast.success('Thank you for your valuable feedback!');
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setFeedback('');
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="How was your meal?"
      description={`Rate your dining experience at ${cafeName}`}
      size="sm"
    >
      {submitted ? (
        <div className="py-8 text-center space-y-2">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
            Thank You!
          </h4>
          <p className="text-xs text-stone-500">
            Your review helps us craft better food and service.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star selector */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 transition-transform active:scale-125 focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-300 dark:text-stone-700'
                  }`}
                />
              </button>
            ))}
          </div>

          <p className="text-center text-xs font-semibold text-stone-600 dark:text-stone-300">
            {rating === 5
              ? '⭐⭐⭐⭐⭐ Exceptional!'
              : rating === 4
              ? '⭐⭐⭐⭐ Great experience'
              : rating === 3
              ? '⭐⭐⭐ Average'
              : rating === 2
              ? '⭐⭐ Could be better'
              : '⭐ Poor service/food'}
          </p>

          <textarea
            rows={3}
            placeholder="Tell us about the coffee, taste, ambience, or service..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 p-3 bg-white/70 dark:bg-stone-900 focus:outline-none focus:border-accent"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Skip
            </Button>
            <Button type="submit" size="sm" leftIcon={<MessageSquare className="h-4 w-4" />}>
              Submit Review
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

