import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import NoticeModal from './NoticeModal';
import { Card } from '../../components/ui/Card';
import { PlusCircleIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '../../components/ui/Icon';
import { AlertDialog } from '../../components/ui/AlertDialog';

const NoticeListPage = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<any | null>(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase.from('notices').select('*');
    if (error) {
      console.error('Error fetching notices:', error);
    } else {
      setNotices(data);
    }
    setIsLoading(false);
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from('notices')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating notice status:', error);
    } else {
      fetchNotices();
    }
  };

  const handleSaveNotice = async (noticeData: any) => {
    if (selectedNotice) {
      // Update existing notice
      const { error } = await supabase
        .from('notices')
        .update(noticeData)
        .eq('id', selectedNotice.id);
      if (error) console.error('Error updating notice:', error);
    } else {
      // Create new notice
      const { error } = await supabase.from('notices').insert([noticeData]);
      if (error) console.error('Error creating notice:', error);
    }
    fetchNotices();
    setIsModalOpen(false);
    setSelectedNotice(null);
  };

  const handleDeleteNotice = async (id: number) => {
    setNoticeToDelete(notices.find(n => n.id === id) || null);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (noticeToDelete) {
      const { error } = await supabase.from('notices').delete().eq('id', noticeToDelete.id);
      if (error) {
        console.error('Error deleting notice:', error);
      } else {
        fetchNotices();
      }
      setIsDeleteAlertOpen(false);
      setNoticeToDelete(null);
    }
  };

  return (

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold text-gray-800">নোটিশ ম্যানেজমেন্ট</h2>
          <Button onClick={() => { setSelectedNotice(null); setIsModalOpen(true); }} leftIcon={<PlusCircleIcon className="w-5 h-5" />}>নতুন নোটিশ তৈরি করুন</Button>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">শিরোনাম</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">তৈরির তারিখ</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">স্ট্যাটাস</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">লোড হচ্ছে...</td>
                  </tr>
                ) : notices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-500">কোনো নোটিশ পাওয়া যায়নি।</td>
                  </tr>
                ) : (
                  notices.map(notice => (
                    <tr key={notice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{notice.title}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{new Date(notice.created_at).toLocaleDateString('bn-BD')}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <Switch
                          checked={notice.is_active}
                          onChange={() => handleToggleActive(notice.id, notice.is_active)}
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <button onClick={() => { setSelectedNotice(notice); setIsModalOpen(true); }} className="text-yellow-500 hover:text-yellow-700 p-1 ml-2" title="সম্পাদনা"><PencilSquareIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleDeleteNotice(notice.id)} className="text-red-500 hover:text-red-700 p-1 ml-2" title="ডিলিট"><TrashIcon className="w-5 h-5"/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
        {isModalOpen && (
          <NoticeModal
            notice={selectedNotice}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveNotice}
          />
        )}
        {isDeleteAlertOpen && noticeToDelete && (
          <AlertDialog
            isOpen={isDeleteAlertOpen}
            onClose={() => setIsDeleteAlertOpen(false)}
            onConfirm={confirmDelete}
            title="নোটিশ ডিলিট করুন"
            description={`আপনি কি নিশ্চিত যে আপনি "${noticeToDelete.title}" নোটিশটি ডিলিট করতে চান?`}
            confirmButtonText="হ্যাঁ, ডিলিট করুন"
          />
        )}
      </div>

  );
};

export default NoticeListPage;
