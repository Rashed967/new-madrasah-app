
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusTimeline } from '../../components/ui/StatusTimeline';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { ArrowPathIcon, MagnifyingGlassIcon, XCircleIcon } from '../../components/ui/Icon';
import { ApplicationStatus } from '../../types';

interface ApplicationData {
  id: string;
  application_status: ApplicationStatus;
  created_at: string;
  examinee_name: string;
  exam_name: string;
  applied_certificates: { type_id: string; name_bn: string; fee: number }[];
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const CertificateStatusPage: React.FC = () => {
  const { addToast } = useToast();
  const [applicationId, setApplicationId] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);

  const { data: applicationData, isLoading, error, isFetching, refetch } = useQuery<ApplicationData | null, Error>({
    queryKey: ['certificateApplicationStatus', applicationId, searchTrigger],
    queryFn: async () => {
      if (!applicationId.trim()) return null;
      const { data, error: rpcError } = await supabase
        .rpc('get_certificate_application_status', { p_application_id: applicationId });
      
      if (rpcError) throw rpcError;
      if (!data) {
        addToast('এই আইডি দিয়ে কোনো আবেদন পাওয়া যায়নি।', 'info');
        return null;
      }
      return data;
    },
    enabled: false, // Only fetch on manual trigger
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId.trim()) {
      addToast('অনুগ্রহ করে আবেদন আইডি দিন।', 'warning');
      return;
    }
    setSearchTrigger(prev => prev + 1);
  };
  
  useEffect(() => {
    if(searchTrigger > 0) {
      refetch();
    }
  }, [searchTrigger, refetch]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <h1 className="text-2xl font-bold text-center text-emerald-700 mb-2">সনদের আবেদনের স্ট্যাটাস</h1>
        <p className="text-center text-gray-600 mb-6">আপনার আবেদন আইডি দিয়ে আবেদনের বর্তমান অবস্থা জানুন।</p>
        
        <form onSubmit={handleSearch} className="max-w-xl mx-auto">
          <label htmlFor="application-id-search" className="block text-sm font-medium text-gray-700 mb-1">
            আপনার আবেদন আইডি
          </label>
          <div className="relative flex w-full shadow-sm rounded-md">
            <Input
              id="application-id-search"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              placeholder="আবেদন আইডি লিখুন..."
              required
              wrapperClassName="mb-0 flex-grow"
              className="h-12 rounded-r-none"
            />
            <Button
              type="submit"
              disabled={isLoading || isFetching}
              className="h-12 rounded-l-none px-4 flex items-center"
            >
              {isLoading || isFetching ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold leading-tight">স্ট্যাটাস</span>
                    <span className="text-sm leading-tight">দেখুন</span>
                  </div>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {(isLoading || isFetching) && searchTrigger > 0 && (
        <Card className="text-center p-8">
           <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-4" />
           <p className="text-gray-700">আপনার আবেদনের তথ্য খোঁজা হচ্ছে...</p>
        </Card>
      )}

      {error && (
        <Card className="text-center p-8 bg-red-50 border border-red-200">
           <XCircleIcon className="w-8 h-8 mx-auto text-red-500 mb-4"/>
           <p className="text-red-700 font-semibold">একটি সমস্যা হয়েছে</p>
           <p className="text-red-600 text-sm">{error.message}</p>
        </Card>
      )}

      {applicationData && !isFetching && (
        <Card>
            <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">আবেদনের বিবরণ</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-gray-700">
                    <div><strong>পরীক্ষার্থীর নাম:</strong> {applicationData.examinee_name}</div>
                    <div><strong>পরীক্ষা:</strong> {applicationData.exam_name}</div>
                    <div><strong>আবেদনের তারিখ:</strong> {formatDate(applicationData.created_at)}</div>
                    <div><strong>আবেদনকৃত সনদ:</strong> {applicationData.applied_certificates.map(c => c.name_bn).join(', ')}</div>
                </div>
                <h2 className="text-xl font-semibold mb-4 text-center">বর্তমান অবস্থা</h2>
                <StatusTimeline currentStatus={applicationData.application_status} />
            </div>
        </Card>
      )}
    </div>
  );
};

export default CertificateStatusPage;
