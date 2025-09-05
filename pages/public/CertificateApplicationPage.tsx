
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { Stepper } from '../../components/ui/Stepper';
import { CertificateType, SelectOption, Marhala, Exam, MarhalaApiResponse } from '../../types';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { ArrowPathIcon, MagnifyingGlassIcon, CheckCircleIcon, UserCircleIcon, ListBulletIcon } from '../../components/ui/Icon';
import { Modal } from '../../components/ui/Modal';

// Helper function to map API response to Marhala type
const mapApiMarhalaToFrontend = (apiMarhala: MarhalaApiResponse): Marhala => ({
  id: apiMarhala.id, marhala_code: apiMarhala.marhala_code, nameBn: apiMarhala.name_bn,
  nameAr: apiMarhala.name_ar || undefined, type: apiMarhala.type, category: apiMarhala.category,
  kitabIds: apiMarhala.kitab_ids || [], marhala_order: apiMarhala.marhala_order,
  requiresPhoto: apiMarhala.requires_photo || false, createdAt: apiMarhala.created_at, updatedAt: apiMarhala.updated_at, 
});

const CertificateApplicationPage: React.FC = () => {
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // Step 1 State
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedMarhalaId, setSelectedMarhalaId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [errors, setErrors] = useState<any>({});
  
  // Step 2 State
  const [examineeInfo, setExamineeInfo] = useState<any>(null);
  const [selectedCertificates, setSelectedCertificates] = useState<Record<string, boolean>>({});
  const [contactMobile, setContactMobile] = useState('');

  // Step 3 State
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

  const { data: exams = [] } = useQuery<Exam[], Error>({
    queryKey: ['publiclyAvailableExamsForCert'],
    queryFn: async () => { const { data, error } = await supabase.from('exams').select('*').in('status', ['completed']).order('created_at', { ascending: false }); if (error) throw error; return (data || []) as Exam[]; },
  });
  
  const { data: marhalas = [] } = useQuery<Marhala[], Error>({
    queryKey: ['allMarhalasForCert'],
    queryFn: async () => { const { data, error } = await supabase.from('marhalas').select('*').order('marhala_order'); if (error) throw error; return (data || []).map(mapApiMarhalaToFrontend); }
  });

  const { data: certificateTypes = [] } = useQuery<CertificateType[], Error>({
    queryKey: ['activeCertificateTypes'],
    queryFn: async () => { const { data, error } = await supabase.from('certificate_types').select('*').eq('is_active', true); if (error) throw error; return data || []; }
  });

  const findExamineeMutation = useMutation({
    mutationFn: async (vars: { examId: string; marhalaId: string; roll: string; reg: string }) => {
        const { data, error } = await supabase.rpc('find_examinee_for_cert_app', { p_exam_id: vars.examId, p_marhala_id: vars.marhalaId, p_roll_number: parseInt(vars.roll), p_registration_number: parseInt(vars.reg) });
        if (error) throw error;
        return data;
    },
    onSuccess: (data) => {
      if (data) {
        setExamineeInfo(data);
        setCompletedSteps(prev => new Set(prev).add(0));
        setCurrentStep(1);
        setErrors({});
      } else {
        addToast('এই তথ্যের জন্য কোনো পরীক্ষার্থী পাওয়া যায়নি।', 'error');
        setExamineeInfo(null);
      }
    },
    onError: (error: any) => { addToast(`অনুসন্ধানে সমস্যা: ${error.message}`, 'error'); }
  });

  const createApplicationMutation = useMutation({
    mutationFn: async (vars: { p_examinee_id: string; p_exam_id: string; p_applied_certificates: any[]; p_total_fee: number; p_contact_mobile: string }) => {
        const { data, error } = await supabase.rpc('create_certificate_application', vars);
        if(error) throw error;
        return data;
    },
    onSuccess: (data) => {
        if(data) {
            setApplicationId((data as { id: string }).id);
            setCompletedSteps(prev => new Set(prev).add(0).add(1));
            setCurrentStep(2);
            setIsPaymentModalOpen(false); // Close modal on success
        }
    },
    onError: (error: any) => { addToast(`আবেদন জমা দিতে সমস্যা: ${error.message}`, 'error'); }
  });

  const examOptions = useMemo(() => exams.map(e => ({ value: e.id, label: e.name })), [exams]);
  const marhalaOptions = useMemo(() => marhalas.map(m => ({ value: m.id, label: `${m.nameBn} (${m.type === 'boys' ? 'বালক' : 'বালিকা'})` })), [marhalas]);

  const totalFee = useMemo(() => {
    return certificateTypes.reduce((total, cert) => {
        return selectedCertificates[cert.id] ? total + cert.fee : total;
    }, 0);
  }, [selectedCertificates, certificateTypes]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    if (!selectedExamId) newErrors.exam = 'পরীক্ষা নির্বাচন করুন।';
    if (!selectedMarhalaId) newErrors.marhala = 'মারহালা নির্বাচন করুন।';
    if (!rollNumber) newErrors.roll = 'রোল নম্বর দিন।';
    if (!registrationNumber) newErrors.reg = 'রেজিস্ট্রেশন নম্বর দিন।';
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      findExamineeMutation.mutate({ examId: selectedExamId, marhalaId: selectedMarhalaId, roll: rollNumber, reg: registrationNumber });
    }
  };

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    if (Object.values(selectedCertificates).every(v => !v)) newErrors.certs = 'কমপক্ষে একটি সনদ নির্বাচন করুন।';
    if (!contactMobile || !/^(01[3-9]\d{8})$/.test(contactMobile)) newErrors.mobile = 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন।';
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
        setPaymentStep('processing');
        setIsPaymentModalOpen(true);
        setTimeout(() => {
            setPaymentStep('success');
        }, 2000);
    }
  };

  const handleConfirmPayment = () => {
    const applied = certificateTypes.filter(c => selectedCertificates[c.id]).map(c => ({type_id: c.id, name_bn: c.name_bn, fee: c.fee}));
    createApplicationMutation.mutate({
        p_examinee_id: examineeInfo.examinee_id,
        p_exam_id: selectedExamId,
        p_applied_certificates: applied,
        p_total_fee: totalFee,
        p_contact_mobile: contactMobile
    });
  };

  const resetForm = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setSelectedExamId('');
    setSelectedMarhalaId('');
    setRollNumber('');
    setRegistrationNumber('');
    setExamineeInfo(null);
    setSelectedCertificates({});
    setContactMobile('');
    setApplicationId(null);
    setErrors({});
  };

  const steps = [
    { id: 'identification', label: 'শনাক্তকরণ', icon: <MagnifyingGlassIcon /> },
    { id: 'selection', label: 'সনদ নির্বাচন', icon: <ListBulletIcon /> },
    { id: 'complete', label: 'আবেদন সম্পন্ন', icon: <CheckCircleIcon /> }
  ];

  return (
    <>
    <Card className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-center text-emerald-700 mb-2">অনলাইন সনদের আবেদন</h1>
        <p className="text-center text-gray-700 mb-6">আপনার প্রয়োজনীয় সনদপত্রের জন্য আবেদন করুন।</p>
        <Stepper steps={steps} currentStep={currentStep} completedSteps={completedSteps} />
        
        <div className="p-6">
            {currentStep === 0 && (
                <form onSubmit={handleStep1Submit} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="পরীক্ষা" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} options={examOptions} placeholderOption="পরীক্ষা নির্বাচন করুন" error={errors.exam} required/>
                        <Select label="মারহালা" value={selectedMarhalaId} onChange={e => setSelectedMarhalaId(e.target.value)} options={marhalaOptions} placeholderOption="মারহালা নির্বাচন করুন" error={errors.marhala} required/>
                        <Input label="রোল নম্বর" type="number" value={rollNumber} onChange={e => setRollNumber(e.target.value)} error={errors.roll} required/>
                        <Input label="রেজিস্ট্রেশন নম্বর" type="number" value={registrationNumber} onChange={e => setRegistrationNumber(e.target.value)} error={errors.reg} required/>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={findExamineeMutation.isPending} leftIcon={findExamineeMutation.isPending ? <ArrowPathIcon className="animate-spin"/> : <MagnifyingGlassIcon />}>
                            {findExamineeMutation.isPending ? 'অনুসন্ধান করা হচ্ছে...' : 'অনুসন্ধান করুন'}
                        </Button>
                    </div>
                </form>
            )}

            {currentStep === 1 && examineeInfo && (
                <div className="space-y-6">
                    <Card title="আপনার তথ্য যাচাই করুন" bodyClassName="space-y-2">
                        <p className="text-gray-800"><strong>নাম:</strong> {examineeInfo.name_bn}</p>
                        <p className="text-gray-800"><strong>পিতার নাম:</strong> {examineeInfo.father_name_bn}</p>
                        <p className="text-gray-800"><strong>মাদরাসা:</strong> {examineeInfo.madrasa_name_bn}</p>
                    </Card>
                    <Card title="সনদ নির্বাচন করুন">
                        <div className="space-y-3">
                            {certificateTypes.map(cert => (
                                <Checkbox key={cert.id} label={`${cert.name_bn} (${cert.fee.toLocaleString('bn-BD')} টাকা)`}
                                    checked={!!selectedCertificates[cert.id]}
                                    onChange={e => setSelectedCertificates(prev => ({...prev, [cert.id]: e.target.checked}))}
                                />
                            ))}
                            {errors.certs && <p className="text-red-500 text-sm">{errors.certs}</p>}
                        </div>
                    </Card>
                     <Card title="যোগাযোগের তথ্য ও পেমেন্ট">
                        <Input label="আপনার বর্তমান মোবাইল নম্বর" type="tel" value={contactMobile} onChange={e => setContactMobile(e.target.value)} error={errors.mobile} required/>
                        <div className="mt-4 p-4 bg-emerald-50 rounded-lg text-center">
                            <p className="text-lg text-gray-800">মোট ফি:</p>
                            <p className="text-3xl font-bold text-emerald-700">{totalFee.toLocaleString('bn-BD')} ৳</p>
                        </div>
                     </Card>
                    <div className="flex justify-between items-center pt-4">
                        <Button variant="secondary" onClick={() => setCurrentStep(0)}>ফিরে যান</Button>
                        <Button onClick={handleInitiatePayment} disabled={createApplicationMutation.isPending || totalFee === 0} >{createApplicationMutation.isPending ? 'প্রসেসিং...' : `${totalFee.toLocaleString('bn-BD')} ৳ পেমেন্ট করুন`}</Button>
                    </div>
                </div>
            )}
             {currentStep === 2 && applicationId && (
                <div className="text-center space-y-4 py-8">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto"/>
                    <h2 className="text-2xl font-bold text-gray-800">আবেদন সফল হয়েছে!</h2>
                    <p className="text-gray-700">আপনার আবেদনটি সফলভাবে জমা হয়েছে। আপনার আবেদন আইডি নিচে দেওয়া হলো। অনুগ্রহ করে এটি সংরক্ষণ করুন।</p>
                    <div className="p-3 bg-gray-100 rounded-md inline-block">
                        <p className="text-sm">আপনার আবেদন আইডি:</p>
                        <p className="text-xl font-bold font-mono text-emerald-700">{applicationId}</p>
                    </div>
                    <div className="pt-4">
                        <Button onClick={resetForm}>নতুন আবেদন করুন</Button>
                    </div>
                </div>
            )}
        </div>
    </Card>
    <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="SSLCommerz স্যান্ডবক্স পেমেন্ট সিমুলেশন" size="md">
        {paymentStep === 'processing' && (
            <div className="text-center p-8">
                <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-4" />
                <p className="text-gray-700">পেমেন্ট গেটওয়েতে সংযোগ করা হচ্ছে...</p>
            </div>
        )}
        {paymentStep === 'success' && (
            <div className="text-center p-8">
                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800">পেমেন্ট সফল হয়েছে</h3>
                <p className="text-sm text-gray-600">আপনার আবেদনটি চূড়ান্তভাবে জমা দিতে নিচের বাটনে ক্লিক করুন।</p>
                <Button onClick={handleConfirmPayment} className="mt-6" disabled={createApplicationMutation.isPending}>
                    {createApplicationMutation.isPending ? 'আবেদন জমা হচ্ছে...' : 'আবেদন নিশ্চিত করুন'}
                </Button>
            </div>
        )}
    </Modal>
    </>
  );
};

export default CertificateApplicationPage;
