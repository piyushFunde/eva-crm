import { useState, useRef, useEffect } from 'react';
import { Camera, IndianRupee, Loader2, WifiOff, CheckCircle2, X, Info, CreditCard, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import useCustomerStore from '@/store/customerStore';
import useAuthStore from '@/store/authStore';
import useNetworkStore from '@/offline/networkManager';
import { saveOfflineCollection } from '@/offline/db';
import { formatCurrency } from '@/utils/formatters';
import api from '@/api/axios';

const collectionSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  notes: z.string().optional(),
});

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI / Scan' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'BANK', label: 'Transfer' }
];

export default function CollectionModal({ customer, onClose, isEdit = false }) {
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [receiptImage, setReceiptImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const { recordCollection, isLoading } = useCustomerStore();
  const { deviceId } = useAuthStore();
  const { isOnline } = useNetworkStore();
  const [editLoading, setEditLoading] = useState(false);
  const [latestTransaction, setLatestTransaction] = useState(null);

  const { register, handleSubmit, setValue, watch, setError, formState: { errors } } = useForm({
    resolver: zodResolver(collectionSchema),
    defaultValues: { amount: (customer?.pendingAmount ?? customer?.emiAmount) || '', notes: '' }
  });

  const watchedAmount = watch('amount');

  const maxLimit = isEdit
    ? (latestTransaction?.previousPendingAmount ?? customer?.pendingAmount ?? customer?.emiAmount ?? 0)
    : (customer?.pendingAmount ?? customer?.emiAmount ?? 0);

  useEffect(() => {
    if (isEdit && customer) {
      setEditLoading(true);
      api.get(`/collections/customer/${customer.id}/latest`)
        .then(res => {
          if (res.success && res.data) {
            setValue('amount', res.data.amountCollected || '');
            setValue('notes', res.data.notes || '');
            setPaymentMode(res.data.paymentMode || 'CASH');
            setLatestTransaction(res.data);
          }
        })
        .catch(err => {
          toast.error(err.message || 'Failed to load transaction details');
        })
        .finally(() => {
          setEditLoading(false);
        });
    }
  }, [isEdit, customer, setValue]);

  if (!customer) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    const amountVal = parseFloat(data.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setError('amount', { type: 'manual', message: 'Amount must be greater than 0' });
      return;
    }
    if (amountVal > maxLimit) {
      toast.error(`Amount cannot exceed the pending balance of ₹${maxLimit}`);
      setError('amount', { type: 'manual', message: `Maximum allowed is ₹${maxLimit}` });
      return;
    }

    if (isEdit) {
      setEditLoading(true);
      try {
        const response = await api.post(`/collections/customer/${customer.id}/latest/edit`, null, {
          params: {
            amount: data.amount,
            paymentMode,
            notes: data.notes || ''
          }
        });
        if (response.success) {
          toast.success(`Transaction Updated: ₹${data.amount}`);
          onClose();
        } else {
          toast.error(response.error || 'Failed to update payment');
        }
      } catch (err) {
        toast.error(err.message || 'Error updating payment');
      } finally {
        setEditLoading(false);
      }
      return;
    }

    const clientGeneratedId = uuidv4();
    
    let processedImage = receiptImage;
    if (receiptImage) {
      try {
        const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true };
        processedImage = await imageCompression(receiptImage, options);
      } catch (err) {
        console.error('Compression failed', err);
      }
    }

    if (!isOnline) {
      await saveOfflineCollection({
        customerId: customer.id,
        amountCollected: data.amount,
        paymentMode,
        notes: data.notes,
        clientGeneratedId,
        deviceId: deviceId || 'unknown-device',
        receiptImageBlob: processedImage,
        customerName: customer.name
      });
      toast.success('Offline Recovery: Saved', {
        icon: <WifiOff className="w-4 h-4 text-orange-500" />
      });
      onClose();
      return;
    }

    const formData = new FormData();
    formData.append('customerId', customer.id);
    formData.append('amountCollected', data.amount);
    formData.append('paymentMode', paymentMode);
    formData.append('clientGeneratedId', clientGeneratedId);
    formData.append('deviceId', deviceId || 'unknown-device');
    if (data.notes) formData.append('notes', data.notes);
    if (processedImage) formData.append('receiptImage', processedImage, receiptImage.name);

    const result = await recordCollection(formData);
    if (result.success) {
      toast.success(`Transaction Complete: ₹${data.amount}`);
      onClose();
    } else {
      toast.error(result.error || 'System error. Try offline.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#0F1923]/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-lg bg-[#1a2d42] rounded-t-[32px] border-t border-white/10 shadow-[0_-15px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-white/10 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#4ECDC4]/10 rounded-xl flex items-center justify-center text-[#4ECDC4]">
               <CreditCard size={20} />
             </div>
             <div>
               <h2 className="text-lg font-black text-white tracking-tight uppercase">{isEdit ? "Payment Edit" : "Recovery Entry"}</h2>
               <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{customer.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="px-6 pb-12 overflow-y-auto no-scrollbar flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pt-4">
            
            {/* Amount Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Transaction Value</label>
                <div className="flex items-center gap-1.5 text-[#4ECDC4] text-[10px] font-bold uppercase">
                  <Info size={12} />
                  {`Max: ${formatCurrency(maxLimit)}`}
                </div>
              </div>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#4ECDC4] transition-colors">
                  <IndianRupee size={24} strokeWidth={3} />
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  className={`w-full bg-white/[0.03] border-2 rounded-2xl py-6 pl-14 pr-6 text-3xl font-black text-white placeholder:text-white/5 outline-none focus:bg-white/[0.06] transition-all ${
                    errors.amount 
                      ? 'border-red-500/50 focus:border-red-500' 
                      : 'border-white/5 focus:border-[#4ECDC4]/50'
                  }`}
                  {...register('amount')}
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-xs font-bold mt-1.5 ml-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block animate-ping" />
                  {errors.amount.message}
                </p>
              )}
              {/* Intelligent Chips */}
              {!isEdit && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { label: 'Full Installment', val: customer.pendingAmount ?? customer.emiAmount },
                    { label: '50% Collection', val: (customer.pendingAmount ?? customer.emiAmount) / 2 },
                    { label: 'Minimum', val: 500 }
                  ].map((chip) => (
                    <button 
                      key={chip.label}
                      type="button" 
                      onClick={() => setValue('amount', chip.val)}
                      className={`flex-shrink-0 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        Math.abs(watchedAmount - chip.val) < 1 
                          ? 'bg-[#4ECDC4] border-[#4ECDC4] text-[#0F1923] shadow-[0_4px_15px_rgba(78,205,196,0.3)]' 
                          : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Mode */}
            <div className="space-y-4">
              <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Payment Channel</label>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setPaymentMode(mode.value)}
                    className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all ${
                      paymentMode === mode.value
                        ? 'bg-[#4ECDC4] border-[#4ECDC4] text-[#0F1923] shadow-lg'
                        : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Proof */}
            {!isEdit && (
              <div className="space-y-4">
                <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Evidence / Receipt</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative h-48 border-2 border-dashed rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all ${
                    previewUrl 
                      ? 'border-[#4ECDC4]/50 bg-[#4ECDC4]/5' 
                      : 'border-white/10 hover:border-[#4ECDC4]/30 bg-white/5'
                  }`}
                >
                  {previewUrl ? (
                    <div className="relative w-full h-full p-2">
                      <img src={previewUrl} className="w-full h-full object-cover rounded-[18px]" />
                      <div className="absolute inset-0 bg-[#0F1923]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[18px]">
                        <Camera className="text-white" size={32} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-[#4ECDC4]/10 rounded-full flex items-center justify-center text-[#4ECDC4] mb-4 group-hover:scale-110 transition-transform">
                        <Camera size={28} />
                      </div>
                      <p className="text-[13px] font-black text-white tracking-tight">Tap to capture receipt</p>
                      <p className="text-[10px] font-bold text-white/20 mt-1.5 uppercase tracking-widest">Supports Camera & Gallery</p>
                    </div>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            )}

            {/* Remark */}
            <div className="space-y-4 pb-4">
              <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Additional Remarks</label>
              <textarea
                className="w-full bg-white/[0.03] border-2 border-white/5 rounded-2xl p-5 text-sm font-bold text-white placeholder:text-white/10 outline-none focus:border-[#4ECDC4]/50 transition-all min-h-[100px] resize-none"
                placeholder="Write any specific details here..."
                {...register('notes')}
              />
            </div>

            {/* Final CTA */}
            <div className="sticky bottom-0 pt-4 pb-6 bg-[#1a2d42] z-10 border-t border-white/5">
              <button
                type="submit"
                disabled={isLoading || editLoading}
                className="w-full bg-[#0F1923] text-white rounded-2xl py-4 font-black text-base flex items-center justify-center gap-3 hover:bg-[#1a2d42] active:scale-[0.98] transition-all shadow-2xl shadow-[#0F1923]/20 relative overflow-hidden group"
              >
                {isLoading || editLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {isEdit ? "Update Payment" : "Receive Payment"}
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ArrowRight size={18} />
                    </div>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
