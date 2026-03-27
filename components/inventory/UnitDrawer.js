'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
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
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Maximize2, 
  IndianRupee, 
  Compass, 
  LayoutGrid,
  Trash2,
  Save
} from 'lucide-react';
import { formatINR, calculateFinalPrice, generateUnitNumber, getStatusConfig } from '@/lib/inventory';
import { toast } from 'sonner';

export default function UnitDrawer({
  open,
  onClose,
  mode = 'add',
  unit,
  tower,
  projectType = 'residential',
  unitConfigs = [],
  floorNumber,
  slotIndex,
  towerId,
  projectId,
  organizationId,
  onSave,
  onDelete,
}) {
  const [formData, setFormData] = useState({
    unit_number: '',
    unit_config: '',
    facing: 'North',
    status: 'available',
    base_price: 0,
    floor_rise_price: 0,
    plc_price: 0,
    size_sqft: 0,
    carpet_area: 0,
    built_up_area: 0,
    super_built_up_area: 0,
    bedrooms: null,
    bathrooms: null,
    metadata: {},
  });

  useEffect(() => {
    if (mode === 'edit' && unit) {
      setFormData({
        unit_number: unit.unit_number || '',
        unit_config: unit.unit_config || '',
        facing: unit.facing || 'North',
        status: unit.status || 'available',
        base_price: Number(unit.base_price) || 0,
        floor_rise_price: Number(unit.floor_rise_price) || 0,
        plc_price: Number(unit.plc_price) || 0,
        size_sqft: Number(unit.size_sqft) || 0,
        carpet_area: Number(unit.carpet_area) || 0,
        built_up_area: Number(unit.built_up_area) || 0,
        super_built_up_area: Number(unit.super_built_up_area) || 0,
        bedrooms: unit.bedrooms || null,
        bathrooms: unit.bathrooms || null,
        metadata: unit.metadata || {},
      });
    } else if (mode === 'add' && tower) {
      const generated = generateUnitNumber(tower.name, floorNumber, slotIndex);
      setFormData(prev => ({
        ...prev,
        unit_number: generated,
        floor_number: floorNumber,
        slot_index: slotIndex,
        tower_id: towerId,
      }));
    }
  }, [mode, unit, tower, floorNumber, slotIndex, towerId]);

  const handleConfigChange = (configLabel) => {
    const config = unitConfigs.find(c => c.label === configLabel);
    if (config) {
      setFormData(prev => ({
        ...prev,
        unit_config: config.label,
        size_sqft: config.size_sqft || 0,
        base_price: config.base_price || 0,
        bedrooms: config.bedrooms || null,
        bathrooms: config.bathrooms || null,
      }));
    } else {
      setFormData(prev => ({ ...prev, unit_config: configLabel }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalPrice = calculateFinalPrice(formData.base_price, formData.floor_rise_price, formData.plc_price);
    
    const payload = {
      ...formData,
      price: finalPrice,
      title: formData.unit_number,
      type: projectType,
      tower_id: towerId,
      floor_number: floorNumber,
      slot_index: slotIndex,
      project_id: projectId,
      organization_id: organizationId,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (error) {
      console.error('Error saving unit:', error);
    }
  };

  const finalPrice = calculateFinalPrice(formData.base_price, formData.floor_rise_price, formData.plc_price);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md w-full p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>
              {mode === 'add' ? 'Add Unit' : 'Edit Unit'} — {tower?.name}
            </SheetTitle>
            {mode === 'edit' && (
              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(unit.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="text-sm text-slate-500 flex gap-2 items-center mt-1">
            <Badge variant="outline">{projectType.toUpperCase()}</Badge>
            <span>Floor {floorNumber === 0 ? 'GF' : floorNumber}</span>
            <span>Slot {slotIndex + 1}</span>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit_number">Unit Number</Label>
                    <Input
                      id="unit_number"
                      value={formData.unit_number}
                      onChange={(e) => setFormData(p => ({ ...p, unit_number: e.target.value }))}
                      placeholder="e.g. A-101"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_config">Configuration</Label>
                    <Select value={formData.unit_config} onValueChange={handleConfigChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Config" />
                      </SelectTrigger>
                      <SelectContent>
                        {unitConfigs.map((c) => (
                          <SelectItem key={c.id || c.label} value={c.label}>
                            {c.label} ({c.size_sqft} sqft)
                          </SelectItem>
                        ))}
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facing">Facing</Label>
                    <Select value={formData.facing} onValueChange={(v) => setFormData(p => ({ ...p, facing: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'].map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['available', 'reserved', 'sold', 'blocked', 'under_maintenance'].map(opt => (
                          <SelectItem key={opt} value={opt} className="capitalize">{opt.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" /> Pricing Details
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base_price">Base Price</Label>
                    <Input
                      id="base_price"
                      type="number"
                      value={formData.base_price}
                      onChange={(e) => setFormData(p => ({ ...p, base_price: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="floor_rise">Floor Rise</Label>
                      <Input
                        id="floor_rise"
                        type="number"
                        value={formData.floor_rise_price}
                        onChange={(e) => setFormData(p => ({ ...p, floor_rise_price: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plc">PLC Charges</Label>
                      <Input
                        id="plc"
                        type="number"
                        value={formData.plc_price}
                        onChange={(e) => setFormData(p => ({ ...p, plc_price: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Final Price</span>
                  <span className="text-lg font-bold text-slate-900">{formatINR(finalPrice)}</span>
                </div>
              </div>

              <Separator />

              {/* Area Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" /> Area Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carpet_area">Carpet Area (sqft)</Label>
                    <Input
                      id="carpet_area"
                      type="number"
                      value={formData.carpet_area}
                      onChange={(e) => setFormData(p => ({ ...p, carpet_area: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="super_built_up">Super Built-up (sqft)</Label>
                    <Input
                      id="super_built_up"
                      type="number"
                      value={formData.super_built_up_area}
                      onChange={(e) => setFormData(p => ({ ...p, super_built_up_area: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              {projectType === 'residential' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bedrooms</Label>
                    <Input
                      type="number"
                      value={formData.bedrooms || ''}
                      onChange={(e) => setFormData(p => ({ ...p, bedrooms: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bathrooms</Label>
                    <Input
                      type="number"
                      value={formData.bathrooms || ''}
                      onChange={(e) => setFormData(p => ({ ...p, bathrooms: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <SheetFooter className="p-6 border-t bg-white">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <Save className="w-4 h-4" />
              {mode === 'add' ? 'Create Unit' : 'Save Changes'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
