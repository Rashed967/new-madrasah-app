
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import { Card } from '../../components/ui/Card';
import { PlusCircleIcon, PencilSquareIcon, TrashIcon, EyeIcon } from '../../components/ui/Icon';
import { AlertDialog } from '../../components/ui/AlertDialog';
import FaqModal from './FaqModal';
import { Modal } from '../../components/ui/Modal';


const FaqListPage = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<any | null>(null);
  const [faqToView, setFaqToView] = useState<any | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState<any | null>(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    const { data, error } = await supabase.rpc('get_all_faqs');
    if (error) {
      console.error('Error fetching FAQs:', error);
    } else {
      setFaqs(data);
    }
    setIsLoading(false);
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase.rpc('update_faq', { p_faq_id: id, p_is_active: !currentStatus });
    if (error) {
      console.error('Error updating FAQ status:', error);
    } else {
      fetchFaqs();
    }
  };

  const handleSaveFaq = async (faqData: any) => {
    if (selectedFaq) {
      // Update existing FAQ
      const { error } = await supabase.rpc('update_faq', { p_faq_id: selectedFaq.id, p_question: faqData.question, p_answer: faqData.answer, p_is_active: faqData.is_active });
      if (error) console.error('Error updating FAQ:', error);
    } else {
      // Create new FAQ
      const { error } = await supabase.rpc('create_faq', { p_question: faqData.question, p_answer: faqData.answer, p_is_active: faqData.is_active });
      if (error) console.error('Error creating FAQ:', error);
    }
    fetchFaqs();
    setIsEditModalOpen(false);
    setSelectedFaq(null);
  };

  const handleDeleteFaq = async (id: number) => {
    setFaqToDelete(faqs.find(f => f.id === id) || null);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (faqToDelete) {
      const { error } = await supabase.rpc('delete_faq', { p_faq_id: faqToDelete.id }); // Soft delete
      if (error) {
        console.error('Error deactivating FAQ:', error);
      } else {
        fetchFaqs();
      }
      setIsDeleteAlertOpen(false);
      setFaqToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold text-gray-800">সাধারণ জিজ্ঞাসা ম্যানেজমেন্ট</h2>
          <Button onClick={() => { setSelectedFaq(null); setIsEditModalOpen(true); }} leftIcon={<PlusCircleIcon className="w-5 h-5" />}>নতুন জিজ্ঞাসা তৈরি করুন</Button>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">প্রশ্ন</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">স্ট্যাটাস</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">লোড হচ্ছে...</td>
                  </tr>
                ) : faqs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">কোনো জিজ্ঞাসা পাওয়া যায়নি।</td>
                  </tr>
                ) : (
                  faqs.map(faq => (
                    <tr key={faq.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{faq.question}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <Switch
                          checked={faq.is_active}
                          onChange={() => handleToggleActive(faq.id, faq.is_active)}
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <button onClick={() => { setFaqToView(faq); setIsViewModalOpen(true); }} className="text-emerald-600 hover:text-emerald-800 p-1" title="দেখুন">
                          <EyeIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => { setSelectedFaq(faq); setIsEditModalOpen(true); }} className="text-yellow-500 hover:text-yellow-700 p-1 ml-2" title="সম্পাদনা"><PencilSquareIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleDeleteFaq(faq.id)} className="text-red-500 hover:text-red-700 p-1 ml-2" title="নিষ্ক্রিয় করুন"><TrashIcon className="w-5 h-5"/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
        {isEditModalOpen && (
          <FaqModal
            faq={selectedFaq}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveFaq}
          />
        )}
        {isViewModalOpen && faqToView && (
            <Modal isOpen={true} onClose={() => setIsViewModalOpen(false)} title="জিজ্ঞাসা দেখুন" size="lg">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600">প্রশ্ন:</h3>
                        <p className="text-md font-medium text-gray-800">{faqToView.question}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600">উত্তর:</h3>
                        <div className="prose prose-sm max-w-none mt-1 text-gray-700" dangerouslySetInnerHTML={{ __html: faqToView.answer }} />
                    </div>
                </div>
                 <div className="flex justify-end mt-6">
                    <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>বন্ধ করুন</Button>
                </div>
            </Modal>
        )}
        {isDeleteAlertOpen && faqToDelete && (
          <AlertDialog
            isOpen={isDeleteAlertOpen}
            onClose={() => setIsDeleteAlertOpen(false)}
            onConfirm={confirmDelete}
            title="জিজ্ঞাসা নিষ্ক্রিয় করুন"
            description={`আপনি কি নিশ্চিত যে আপনি "${faqToDelete.question}" জিজ্ঞাসাটি নিষ্ক্রিয় করতে চান?`}
            confirmButtonText="হ্যাঁ, নিষ্ক্রিয় করুন"
          />
        )}
    </div>
  );
};

export default FaqListPage;
