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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Building2, Save, Trash2, LayoutGrid, Layers } from 'lucide-react';
import { autoNameTower } from '@/lib/inventory';

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
  }, [mode, tower, existingTowerCount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving tower:', error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>
              {mode === 'add' ? 'Add New Tower' : 'Edit Tower Settings'}
            </SheetTitle>
            {mode === 'edit' && (
              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => onDelete(tower.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tower_name">Tower Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="tower_name"
                    className="pl-9"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Tower A, Block 1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_floors" className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-400" /> Total Floors
                  </Label>
                  <Input
                    id="total_floors"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.total_floors}
                    onChange={(e) => setFormData(p => ({ ...p, total_floors: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="units_per_floor" className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-slate-400" /> Units Per Floor
                  </Label>
                  <Input
                    id="units_per_floor"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.units_per_floor}
                    onChange={(e) => setFormData(p => ({ ...p, units_per_floor: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tower_desc">Description (Optional)</Label>
                <Textarea
                  id="tower_desc"
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Additional details about this tower..."
                  className="min-h-[100px]"
                />
              </div>

            </div>

            <Separator />
            
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex gap-3 text-sm text-blue-700">
               <div className="p-1 bg-blue-100 rounded h-fit shrink-0">
                  <Layers className="w-4 h-4" />
               </div>
               <div>
                 <p className="font-semibold mb-1">Floor Plan Ready</p>
                 <p className="opacity-80">This will create a virtual grid of {formData.total_floors * formData.units_per_floor} slots. You can then fill them with units.</p>
               </div>
            </div>
          </div>

          <SheetFooter className="p-6 border-t bg-white">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <Save className="w-4 h-4" />
              {mode === 'add' ? 'Create Tower' : 'Save Settings'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
