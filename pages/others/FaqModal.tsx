import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';
import { Modal } from '../../components/ui/Modal';

interface FaqModalProps {
  faq: any; // Consider defining a more specific type for FAQ
  onClose: () => void;
  onSave: (faqData: { question: string; answer: string; is_active: boolean }) => void;
}

const FaqModal: React.FC<FaqModalProps> = ({ faq, onClose, onSave }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (faq) {
      setQuestion(faq.question);
      setAnswer(faq.answer);
      setIsActive(faq.is_active);
    } else {
      // Reset form when creating a new FAQ
      setQuestion('');
      setAnswer('');
      setIsActive(true);
    }
  }, [faq]);

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) {
      alert('প্রশ্ন এবং উত্তর উভয়ই আবশ্যক।');
      return;
    }
    onSave({ question, answer, is_active: isActive });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={faq ? 'জিজ্ঞাসা এডিট করুন' : 'নতুন জিজ্ঞাসা তৈরি করুন'} size="lg">
      <div className="space-y-4">
        <Input
          label="প্রশ্ন"
          placeholder="প্রশ্ন লিখুন"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />
        <Textarea
          label="উত্তর"
          placeholder="উত্তর লিখুন"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
          rows={4}
        />
        <div className="flex items-center space-x-2">
          <Switch
            id="is-active"
            checked={isActive}
            onChange={setIsActive}
          />
          <label htmlFor="is-active">সক্রিয়</label>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={onClose} className="mr-2">বাতিল</Button>
        <Button onClick={handleSave}>সংরক্ষণ করুন</Button>
      </div>
    </Modal>
  );
};

export default FaqModal; 