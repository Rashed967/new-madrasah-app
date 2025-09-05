import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Switch } from '../../components/ui/Switch';

const NoticeModal = ({ notice, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (notice) {
      setTitle(notice.title);
      setContent(notice.content);
      setIsActive(notice.is_active);
    }
  }, [notice]);

  const handleSave = () => {
    onSave({ title, content, is_active: isActive });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-1/2">
        <h2 className="text-xl font-bold mb-4">{notice ? 'নোটিশ এডিট করুন' : 'নতুন নোটিশ তৈরি করুন'}</h2>
        <div className="space-y-4">
          <Input
            placeholder="শিরোনাম"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="বিবরণ"
            value={content}
            onChange={(e) => setContent(e.target.value)}
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
      </div>
    </div>
  );
};

export default NoticeModal;
