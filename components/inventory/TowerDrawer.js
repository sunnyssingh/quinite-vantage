'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Building2, Save, Trash2, LayoutGrid, Layers, ShieldCheck, ChevronRight } from 'lucide-react';
import { autoNameTower } from '@/lib/inventory';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function TowerDrawer({
  open,
  onClose,
  mode = 'add',
  tower,
  projectId,
  organizationId,
  existingTowerCount = 0,
  onSave,
  onDelete,
}) {
  const [formData, setFormData] = useState({
    name: '',
    total_floors: 10,
    units_per_floor: 4,
    description: '',
    order_index: existingTowerCount,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && tower) {
      setFormData({
        name: tower.name || '',
        total_floors: tower.total_floors || 10,
        units_per_floor: tower.units_per_floor || 4,
        description: tower.description || '',
        order_index: tower.order_index || 0,
      });
    } else if (mode === 'add') {
      const defaultName = autoNameTower(Array(existingTowerCount).fill({}));
      setFormData({
        name: defaultName,
        total_floors: 10,
        units_per_floor: 4,
        description: '',
        order_index: existingTowerCount,
      });
    }
  }, [mode, tower, existingTowerCount, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      toast.success(mode === 'add' ? 'Tower Synthesized' : 'Protocol Updated');
      onClose();
    } catch (error) {
      console.error('Error saving tower:', error);
      toast.error('Architectural failure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col border-0 shadow-2xl overflow-hidden bg-white">
        {/* Premium Header */}
        <div className="bg-slate-900 p-8 pt-10 text-white shrink-0">
          <SheetHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                    <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">
                    {mode === 'add' ? 'New Structure' : 'Edit Tower'}
                  </SheetTitle>
                  <SheetDescription className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                    {mode === 'add' ? 'Initializing spatial mapping' : `Updating parameters for ${tower?.name}`}
                  </SheetDescription>
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="flex-1 p-8 space-y-10 overflow-y-auto">
            {/* Core Specs */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-slate-100" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Architectural Core</span>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Structure Label</Label>
                    <Input
                        className="h-12 bg-slate-50 border-slate-100 font-black text-lg tracking-tight rounded-xl focus:bg-white transition-all shadow-sm"
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Tower A"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1"><Layers className="w-3 h-3"/> Verticality</Label>
                        <Input
                            type="number"
                            min="1"
                            max="60"
                            className="h-12 bg-slate-50 border-slate-100 font-black rounded-xl text-center"
                            value={formData.total_floors}
                            onChange={(e) => setFormData(p => ({ ...p, total_floors: Number(e.target.value) }))}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1"><LayoutGrid className="w-3 h-3"/> Spacing</Label>
                        <Input
                            type="number"
                            min="1"
                            max="12"
                            className="h-12 bg-slate-50 border-slate-100 font-black rounded-xl text-center"
                            value={formData.units_per_floor}
                            onChange={(e) => setFormData(p => ({ ...p, units_per_floor: Number(e.target.value) }))}
                            required
                        />
                    </div>
                </div>
            </div>

            {/* Metadata */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-slate-100" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Metadata & Notes</span>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>
                <Textarea
                    className="h-32 bg-slate-50 border-slate-100 font-bold rounded-2xl resize-none p-4 text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Enter architectural observations or specific tower constraints..."
                />
            </div>

            {/* Summary Panel */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white flex items-center justify-between shadow-2xl shadow-slate-200 border border-slate-800">
               <div className="space-y-1">
                 <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] block leading-none">Total Grid Capacity</p>
                 <p className="text-2xl font-black text-white tracking-tight leading-none mt-1">{formData.total_floors * formData.units_per_floor} Units Allocated</p>
               </div>
               <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/5">
                  <LayoutGrid className="w-6 h-6 text-white" />
               </div>
            </div>
          </div>

          <SheetFooter className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
             <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest text-slate-400">Cancel</Button>
             <Button type="submit" disabled={loading} className="flex-1 h-12 bg-slate-900 hover:bg-black font-black uppercase text-xs tracking-[0.15em] rounded-xl shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02] flex items-center gap-3">
                <ShieldCheck className="w-4 h-4" />
                {mode === 'add' ? 'Deploy Structure' : 'Update Matrix'}
             </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
