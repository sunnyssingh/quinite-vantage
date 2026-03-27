'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Maximize2, 
  IndianRupee, 
  Compass, 
  LayoutGrid,
  Trash2,
  Save,
  Archive,
  User,
  ChevronRight,
  ShieldCheck,
  Bed,
  Scaling,
  TowerControl
} from 'lucide-react';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { formatINR, calculateFinalPrice, generateUnitNumber, getStatusConfig } from '@/lib/inventory';
import { useLeads } from '@/hooks/useLeads';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function UnitDrawer({
  open,
  onClose,
  mode = 'add',
  unit,
  tower,
  projectType = 'residential',
  unitConfigs = [],
  floorNumber,
  towerId,
  projectId,
  organizationId,
  onSave,
  onDelete,
}) {
  const [formData, setFormData] = useState({
    unit_number: '',
    config_id: '',
    facing: 'North',
    status: 'available',
    transaction_type: 'sell',
    base_price: 0,
    floor_rise_price: 0,
    plc_price: 0,
    total_price: 0,
    carpet_area: 0,
    built_up_area: 0,
    super_built_up_area: 0,
    plot_area: 0,
    bedrooms: null,
    bathrooms: null,
    balconies: 0,
    is_corner: false,
    is_vastu_compliant: false,
    possession_date: '',
    completion_date: '',
    construction_status: 'under_construction',
    lead_id: null,
    metadata: {},
  });

  const [openLeadPicker, setOpenLeadPicker] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const { data: leadsData } = useLeads({ search: leadSearch, limit: 10 });
  const leads = leadsData?.leads || [];

  useEffect(() => {
    if (mode === 'edit' && unit) {
      setFormData({
        unit_number: unit.unit_number || '',
        config_id: unit.config_id || '',
        facing: unit.facing || 'North',
        status: unit.status || 'available',
        transaction_type: unit.transaction_type || 'sell',
        base_price: Number(unit.base_price) || 0,
        floor_rise_price: Number(unit.floor_rise_price) || 0,
        plc_price: Number(unit.plc_price) || 0,
        total_price: Number(unit.total_price) || 0,
        carpet_area: Number(unit.carpet_area) || 0,
        built_up_area: Number(unit.built_up_area) || 0,
        super_built_up_area: Number(unit.super_built_up_area) || 0,
        plot_area: Number(unit.plot_area) || 0,
        bedrooms: unit.bedrooms || null,
        bathrooms: unit.bathrooms || null,
        balconies: unit.balconies || 0,
        is_corner: unit.is_corner || false,
        is_vastu_compliant: unit.is_vastu_compliant || false,
        possession_date: unit.possession_date ? unit.possession_date.split('T')[0] : '',
        completion_date: unit.completion_date ? unit.completion_date.split('T')[0] : '',
        construction_status: unit.construction_status || 'under_construction',
        lead_id: unit.lead_id || null,
        metadata: unit.metadata || {},
      });
    } else if (mode === 'add' && tower) {
      // In add mode, we don't have a specific slot index anymore
      setFormData(prev => ({
        ...prev,
        unit_number: '', // Let user type it or generate it without slot
        floor_number: floorNumber,
        tower_id: towerId,
      }));
    }
  }, [mode, unit, tower, floorNumber, towerId, open]);

  const handleConfigChange = (configId) => {
    const config = unitConfigs.find(c => c.id === configId);
    if (config) {
      setFormData(prev => ({
        ...prev,
        config_id: configId,
        transaction_type: config.transaction_type || prev.transaction_type,
        carpet_area: config.carpet_area || 0,
        built_up_area: config.builtup_area || 0,
        super_built_up_area: config.super_builtup_area || 0,
        plot_area: config.plot_area || 0,
        base_price: config.base_price || 0,
        bedrooms: config.bedrooms || null,
        bathrooms: config.bathrooms || null,
        facing: config.facing || prev.facing
      }));
    } else {
      setFormData(prev => ({ ...prev, config_id: configId }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const calculatedTotal = calculateFinalPrice(formData.base_price, formData.floor_rise_price, formData.plc_price);
    const payload = {
      ...formData,
      total_price: calculatedTotal,
      tower_id: tower.id,
      floor_number: floorNumber,
      project_id: projectId,
      organization_id: organizationId,
    };

    try {
      await onSave(payload);
      toast.success(mode === 'add' ? 'Listing Created' : 'Update Executed');
      onClose();
    } catch (error) {
      toast.error('Failed to save listing');
    }
  };

  const finalPrice = calculateFinalPrice(formData.base_price, formData.floor_rise_price, formData.plc_price);
  const selectedLead = leads.find(l => l.id === formData.lead_id);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col border-0 shadow-2xl overflow-hidden bg-white">
        {/* Dynamic Header */}
        <div className={cn(
            "p-8 pt-10 text-white shrink-0 transition-colors duration-500",
            formData.status === 'sold' ? 'bg-rose-600' : 'bg-slate-900'
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                  <TowerControl className="w-5 h-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-1">
                  {mode === 'add' ? 'New Unit' : `Unit ${formData.unit_number}`}
                </SheetTitle>
                <SheetDescription className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                  Listing Control • {tower?.name} • Floor {floorNumber}
                </SheetDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {mode === 'edit' && (
                <>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10" onClick={() => onDelete(unit.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10">
                    <Archive className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-white">
          <ScrollArea className="flex-1 p-8">
            <div className="space-y-10">
              {/* Profile Mapping */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-slate-100" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuration Mapping</span>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unit Number</Label>
                    <Input
                      value={formData.unit_number}
                      onChange={(e) => setFormData(p => ({ ...p, unit_number: e.target.value }))}
                      className="h-12 bg-slate-50 border-slate-100 font-black text-lg tracking-tight rounded-xl focus:bg-white transition-all shadow-sm"
                      placeholder="e.g. 901"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Linked Config</Label>
                    <Select value={formData.config_id} onValueChange={handleConfigChange} required>
                      <SelectTrigger className="h-12 bg-slate-50 border-slate-100 font-bold rounded-xl shadow-sm text-slate-900 leading-tight">
                        <SelectValue placeholder="Select Profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitConfigs.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="font-bold">
                            {c.config_name} ({c.bedrooms}BHK)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Status & Ops */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-slate-100" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operation Status</span>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                      <SelectTrigger className={cn(
                        "h-12 font-black uppercase text-[10px] tracking-widest rounded-xl border-0 shadow-xl transition-all",
                        formData.status === 'available' ? 'bg-emerald-500 text-white shadow-emerald-100' : 
                        formData.status === 'sold' ? 'bg-rose-600 text-white shadow-rose-100' : 'bg-slate-900 text-white shadow-slate-200'
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['available', 'reserved', 'sold', 'blocked', 'under_maintenance'].map(opt => (
                          <SelectItem key={opt} value={opt} className="font-bold uppercase text-[10px] tracking-widest py-3">
                             {opt.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Commercial Flow</Label>
                    <Select value={formData.transaction_type} onValueChange={(v) => setFormData(p => ({ ...p, transaction_type: v }))}>
                      <SelectTrigger className="h-12 bg-slate-50 border-slate-100 font-black uppercase text-[10px] tracking-widest rounded-xl shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['sell', 'rent', 'lease'].map(opt => (
                          <SelectItem key={opt} value={opt} className="font-black uppercase text-[10px] tracking-widest">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Valuation Panel */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-slate-100" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Valuation</span>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><IndianRupee className="w-3 h-3"/> Base</Label>
                      <Input type="number" value={formData.base_price} onChange={e => setFormData(p => ({ ...p, base_price: Number(e.target.value) }))} className="h-11 bg-white border-slate-100 font-black rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escalation</Label>
                      <Input type="number" value={formData.floor_rise_price} onChange={e => setFormData(p => ({ ...p, floor_rise_price: Number(e.target.value) }))} className="h-11 bg-white border-slate-100 font-black rounded-xl" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Premium</Label>
                      <Input type="number" value={formData.plc_price} onChange={e => setFormData(p => ({ ...p, plc_price: Number(e.target.value) }))} className="h-11 bg-white border-slate-100 font-black rounded-xl" />
                    </div>
                  </div>
                  
                  <div className="bg-slate-900 p-6 rounded-2xl text-white flex justify-between items-center shadow-2xl shadow-slate-200 border border-slate-800">
                     <div className="space-y-1">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block leading-none">Net Sale Consideration</span>
                       <p className="text-2xl font-black tracking-tight">{formatINR(finalPrice)}</p>
                     </div>
                     <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/5">
                        <IndianRupee className="w-6 h-6 text-white" />
                     </div>
                  </div>
                </div>
              </div>

               {/* Specs Panel */}
               <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-slate-100" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technical Specs</span>
                    <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-1"><Bed className="w-3 h-3"/> Beds</Label>
                    <Input type="number" value={formData.bedrooms || ''} onChange={e => setFormData(p => ({ ...p, bedrooms: e.target.value ? parseInt(e.target.value) : null }))} className="h-9 bg-white border-slate-200 font-black rounded-lg text-center" />
                  </div>
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-1">Baths</Label>
                    <Input type="number" value={formData.bathrooms || ''} onChange={e => setFormData(p => ({ ...p, bathrooms: e.target.value ? parseInt(e.target.value) : null }))} className="h-9 bg-white border-slate-200 font-black rounded-lg text-center" />
                  </div>
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-1"><Scaling className="w-3 h-3"/> SQFT</Label>
                    <Input type="number" value={formData.carpet_area} onChange={e => setFormData(p => ({ ...p, carpet_area: Number(e.target.value) }))} className="h-9 bg-white border-slate-200 font-black rounded-lg text-center" />
                  </div>
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-1">Facing</Label>
                    <Select value={formData.facing} onValueChange={(v) => setFormData(p => ({ ...p, facing: v }))}>
                      <SelectTrigger className="h-9 bg-white border-slate-200 font-black rounded-lg text-[10px] p-0 px-2 uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['North', 'South', 'East', 'West', 'North-East'].map(f => (<SelectItem key={f} value={f} className="text-[10px] font-bold uppercase">{f}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Lead Association */}
              <div className="pt-6 border-t border-slate-100">
                 <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Customer Association</Label>
                 {formData.lead_id ? (
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border-2 border-blue-100 group">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-blue-100">
                          {selectedLead?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                          <p className="font-black text-slate-900 tracking-tight leading-none mb-1">{selectedLead?.name}</p>
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{selectedLead?.phone || 'NO CONTACT'}</p>
                      </div>
                      <button type="button" onClick={() => setFormData(p => ({...p, lead_id: null}))} className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-400 hover:text-red-500">
                          <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                 ) : (
                    <Popover open={openLeadPicker} onOpenChange={setOpenLeadPicker}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-14 bg-slate-50 border-slate-100 rounded-2xl flex items-center justify-between px-5 hover:bg-slate-100 transition-colors border-2 group">
                            <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                <span className="text-sm font-black text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-widest">Search Lead Profiles...</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-200" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-0 shadow-2xl rounded-2xl overflow-hidden" align="start">
                        <Command shouldFilter={false}>
                            <CommandInput placeholder="Search by name or phone..." value={leadSearch} onValueChange={setLeadSearch} className="h-12 border-0 font-bold" />
                            <CommandList className="max-h-[300px]">
                              <CommandEmpty className="py-10 text-center font-bold text-[10px] uppercase text-slate-400 tracking-widest">No Matches Found</CommandEmpty>
                              <CommandGroup>
                                  {leads.map((lead) => (
                                    <CommandItem key={lead.id} onSelect={() => { setFormData(p => ({ ...p, lead_id: lead.id })); setOpenLeadPicker(false); }} className="px-4 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer">
                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black uppercase text-xs">
                                          {lead.name?.charAt(0)}
                                        </div>
                                        <div>
                                          <p className="font-black text-slate-900 tracking-tight leading-none mb-1">{lead.name}</p>
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{lead.phone || lead.email}</p>
                                        </div>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                 )}
              </div>
            </div>
          </ScrollArea>

          <footer className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
             <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest text-slate-400">Abort Changes</Button>
             <Button type="submit" className="flex-1 h-12 bg-slate-900 hover:bg-black font-black uppercase text-xs tracking-[0.15em] rounded-xl shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02] flex items-center gap-3">
                <ShieldCheck className="w-4 h-4" />
                {mode === 'add' ? 'Deploy Listing' : 'Sync Changes'}
             </Button>
          </footer>
        </form>
      </SheetContent>
    </Sheet>
  );
}
