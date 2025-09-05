

import React from 'react';
import { Card } from '../components/ui/Card';

interface PlaceholderPageProps {
  title?: string;
  message?: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title = "Page Not Found",
  message = "এই পৃষ্ঠাটি শীঘ্রই আসছে...",
  description = "আমরা এই বৈশিষ্ট্যটি তৈরি করার জন্য কঠোর পরিশ্রম করছি। আরো আপডেটের জন্য থাকুন!"
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Card className="w-full max-w-2xl text-center">
        <div className="p-10">
          <h1 className="text-3xl font-bold text-[#52b788] mb-4">{title}</h1>
          <p className="text-xl text-gray-600 mb-2">{message}</p>
          <p className="text-gray-500">
            {description}
          </p>
          <img src="https://picsum.photos/400/200?grayscale&blur=2" alt="Coming Soon" className="mt-8 mx-auto rounded-lg shadow-md" />
        </div>
      </Card>
    </div>
  );
};

export default PlaceholderPage;