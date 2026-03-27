'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, 
  Building2, 
  Map as MapIcon, 
  LayoutGrid, 
  List, 
  Search, 
  Filter,
  MoreVertical,
  ChevronDown,
  ArrowRight,
  Info,
  Layers,
  MoreHorizontal
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventory } from '@/hooks/useInventory';
import { 
  STATUS_STYLES, 
  formatINR, 
  getInventoryStats, 
  getStatusConfig,
  buildEmptyFloorSlots 
} from '@/lib/inventory';
import UnitDrawer from './UnitDrawer';
import TowerDrawer from './TowerDrawer';
import FloorPlanLand from './FloorPlanLand';
import { cn } from '@/lib/utils';

export default function VisualUnitGrid({ projectId, project, organizationId, readOnly = false }) {
  const projectType = project?.project_type || 'residential';
  const { 
    towers, 
    units, 
    isLoading, 
    addTower, 
    updateTower, 
    deleteTower,
    addUnit, 
    updateUnit, 
    deleteUnit,
    updateUnitStatus
  } = useInventory({ projectId, organizationId });

  const [activeTowerId, setActiveTowerId] = useState(null);
  const [activeView, setActiveView] = useState('visual');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState(null); // 'add_unit', 'edit_unit', 'add_tower', 'edit_tower'
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [targetFloor, setTargetFloor] = useState(null);
  const [targetSlot, setTargetSlot] = useState(null);

  // Set first tower as active by default
  useMemo(() => {
    if (towers.length > 0 && !activeTowerId) {
      setActiveTowerId(towers[0].id);
    }
  }, [towers, activeTowerId]);

  const activeTower = towers.find(t => t.id === activeTowerId);
  const towerUnits = units[activeTowerId] || [];

  const stats = useMemo(() => getInventoryStats(towerUnits), [towerUnits]);
  const overallStats = useMemo(() => {
    const allUnits = Object.values(units).flat();
    return getInventoryStats(allUnits);
  }, [units]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex gap-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-24" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const handleAddTower = () => {
    setDrawerMode('add_tower');
    setDrawerOpen(true);
  };

  const handleEditTower = (tower) => {
    setDrawerMode('edit_tower');
    setSelectedUnit(null); // reuse for tower in tower mode
    setDrawerOpen(true);
  };

  const handleOpenAddUnit = (floorNum, slotIdx) => {
    setTargetFloor(floorNum);
    setTargetSlot(slotIdx);
    setDrawerMode('add_unit');
    setSelectedUnit(null);
    setDrawerOpen(true);
  };

  const handleEditUnit = (unit) => {
    setSelectedUnit(unit);
    setTargetFloor(unit.floor_number);
    setTargetSlot(unit.slot_index);
    setDrawerMode('edit_unit');
    setDrawerOpen(true);
  };

  if (projectType === 'land') {
     return <FloorPlanLand projectId={projectId} project={project} units={Object.values(units).flat()} organizationId={organizationId} onAddTower={handleAddTower} />;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Top Bar - Tower Navigation */}
      <div className="px-4 pt-4 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center justify-between mb-2">
           <div className="flex gap-1">
              {towers.map(tower => (
                <button
                  key={tower.id}
                  onClick={() => setActiveTowerId(tower.id)}
                  className={cn(
                    "px-4 py-2 rounded-t-lg text-sm font-medium transition-all relative border-x border-t",
                    activeTowerId === tower.id
                      ? "bg-white border-slate-200 text-slate-900 -mb-[1px] z-10 shadow-[0_-2px_4px_rgba(0,0,0,0.02)]"
                      : "bg-transparent border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  {tower.name}
                  <span className="ml-2 text-[10px] opacity-60">
                    {towerUnits.filter(u => u.tower_id === tower.id && u.status === 'available').length}
                  </span>
                </button>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleAddTower}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 ml-2"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Tower
              </Button>
           </div>

           <div className="flex items-center gap-2 pb-2">
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <Button 
                  variant={activeView === 'visual' ? 'white' : 'ghost'} 
                  size="sm" 
                  onClick={() => setActiveView('visual')}
                  className={cn("h-7 px-3 text-xs gap-1.5", activeView === 'visual' && "bg-white shadow-sm")}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Visual
                </Button>
                <Button 
                  variant={activeView === 'list' ? 'white' : 'ghost'} 
                  size="sm" 
                  onClick={() => setActiveView('list')}
                  className={cn("h-7 px-3 text-xs gap-1.5", activeView === 'list' && "bg-white shadow-sm")}
                >
                  <List className="w-3.5 h-3.5" /> List
                </Button>
              </div>
           </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
           <StatChip status="available" count={stats.available} />
           <StatChip status="reserved" count={stats.reserved} />
           <StatChip status="sold" count={stats.sold} />
           <StatChip status="blocked" count={stats.blocked} />
           <StatChip status="under_maintenance" count={stats.under_maintenance} />
        </div>
        
        <div className="ml-auto hidden md:flex items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex flex-col items-end">
            <span className="text-slate-400">Inventory Value</span>
            <span className="text-slate-900">{formatINR(stats.totalValue)}</span>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex flex-col items-end">
            <span className="text-slate-400">Total Units</span>
            <span className="text-slate-900">{stats.total} across {towers.length} towers</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEditTower(activeTower)}>
                 Edit Tower Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={() => deleteTower(activeTowerId)}>
                 Delete Tower
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Floor Grid Canvas */}
      <TooltipProvider>
        <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-4">
            {activeTower ? (
              Array.from({ length: activeTower.total_floors + 1 }, (_, i) => activeTower.total_floors - i).map(floorNum => (
                <FloorRow 
                  key={floorNum}
                  floorNum={floorNum}
                  tower={activeTower}
                  units={towerUnits}
                  onUnitClick={handleEditUnit}
                  onAddUnit={handleOpenAddUnit}
                  onStatusChange={updateUnitStatus}
                  onDeleteUnit={deleteUnit}
                  projectType={projectType}
                />
              ))
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                <Building2 className="w-12 h-12 mb-4 opacity-20" />
                <p>No towers found for this project.</p>
                <Button onClick={handleAddTower} variant="outline" className="mt-4">
                  + Add your first tower
                </Button>
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>

      {/* Drawers */}
      {drawerMode?.includes('unit') ? (
        <UnitDrawer 
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          mode={drawerMode === 'add_unit' ? 'add' : 'edit'}
          unit={selectedUnit}
          tower={activeTower}
          projectType={projectType}
          unitConfigs={project?.metadata?.unit_configs?.[projectType] || []}
          floorNumber={targetFloor}
          slotIndex={targetSlot}
          towerId={activeTowerId}
          projectId={projectId}
          organizationId={organizationId}
          onSave={drawerMode === 'add_unit' ? addUnit : (data) => updateUnit(selectedUnit.id, data)}
          onDelete={deleteUnit}
        />
      ) : (
        <TowerDrawer 
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          mode={drawerMode === 'add_tower' ? 'add' : 'edit'}
          tower={activeTower}
          projectId={projectId}
          organizationId={organizationId}
          existingTowerCount={towers.length}
          onSave={drawerMode === 'add_tower' ? addTower : (data) => updateTower(activeTowerId, data)}
          onDelete={deleteTower}
        />
      )}
    </div>
  );
}

function FloorRow({ floorNum, tower, units, onUnitClick, onAddUnit, onStatusChange, onDeleteUnit, projectType }) {
  const slots = useMemo(() => buildEmptyFloorSlots(tower, units, floorNum), [tower, units, floorNum]);
  const isGround = floorNum === 0;

  return (
    <div className="flex items-start gap-4 group">
      {/* Floor Label */}
      <div className="w-16 pt-2 shrink-0 flex flex-col items-end">
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded",
          isGround ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"
        )}>
          {isGround ? 'GF' : `F${floorNum}`}
        </span>
        <span className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
           {isGround ? 'Ground' : `Floor ${floorNum}`}
        </span>
      </div>

      {/* Units Horizontal Scroll */}
      <div className="flex gap-3 pb-4 flex-1 overflow-x-auto no-scrollbar">
        {slots.map((unit, idx) => (
          <div key={idx} className="shrink-0 flex-1 min-w-[120px] max-w-[180px]">
            {unit ? (
              <UnitCell 
                unit={unit} 
                onClick={() => onUnitClick(unit)} 
                onStatusChange={onStatusChange}
                onDelete={() => onDeleteUnit(unit.id)}
                projectType={projectType}
              />
            ) : (
              <EmptySlot onClick={() => onAddUnit(floorNum, idx)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UnitCell({ unit, onClick, onStatusChange, onDelete, projectType }) {
  const style = getStatusConfig(unit.status);
  
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            onClick={onClick}
            className={cn(
              "p-3 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden group/cell",
              style.bg,
              style.border,
              "hover:shadow-md hover:-translate-y-0.5"
            )}
          >
            {/* Top Row: Unit Num + Config */}
            <div className="flex justify-between items-start mb-2">
              <span className={cn("text-[11px] font-bold leading-none", style.text)}>
                {unit.unit_number}
              </span>
              <span className="text-[9px] font-medium opacity-70 leading-none">
                {unit.unit_config}
              </span>
            </div>

            {/* Middle Row: Price */}
            <div className={cn("text-xs font-bold mb-1", style.text)}>
              {formatINR(unit.price)}
            </div>

            {/* Bottom Row: Status Dot + Label */}
            <div className="flex items-center gap-1.5 mt-2">
               <div className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
               <span className={cn("text-[9px] font-bold uppercase tracking-wider opacity-80", style.text)}>
                 {unit.status.replace('_', ' ')}
               </span>
            </div>

            {/* Kebab for quick actions */}
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 p-1 rounded-md hover:bg-black/5 transition-opacity">
                 <MoreHorizontal className={cn("w-3.5 h-3.5", style.text)} />
              </button>
            </DropdownMenuTrigger>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-3 bg-white border shadow-xl max-w-xs">
           <div className="space-y-1 text-slate-900">
              <p className="font-bold border-b pb-1 mb-1">{unit.unit_number || unit.title}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                 <span className="text-slate-500">Config:</span> <span className="font-medium">{unit.unit_config}</span>
                 <span className="text-slate-500">Facing:</span> <span className="font-medium">{unit.facing}</span>
                 <span className="text-slate-500">Area:</span> <span className="font-medium">{unit.size_sqft} sqft</span>
                 <span className="text-slate-500">Status:</span> <Badge variant="outline" className="h-4 py-0 text-[10px] capitalize">{unit.status}</Badge>
              </div>
              <p className="text-[10px] text-slate-400 pt-2 italic">Click to edit details</p>
           </div>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onClick}>View & Edit Details</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {['available', 'reserved', 'sold', 'blocked', 'under_maintenance'].map(status => (
              <DropdownMenuItem 
                key={status} 
                className="capitalize"
                onClick={() => onStatusChange(unit.id, status)}
              >
                <div className={cn("w-2 h-2 rounded-full mr-2", getStatusConfig(status).dot)} />
                {status.replace('_', ' ')}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600" onClick={onDelete}>
          Delete Unit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptySlot({ onClick }) {
  return (
    <div 
      onClick={onClick}
      className="h-[80px] rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
    >
      <Plus className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
      <span className="text-[9px] font-bold text-slate-400 group-hover:text-blue-500 mt-1 uppercase tracking-tighter">
        Add Unit
      </span>
    </div>
  );
}

function StatChip({ status, count }) {
  const config = getStatusConfig(status);
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full border whitespace-nowrap",
      config.bg,
      config.border
    )}>
      <div className={cn("w-2 h-2 rounded-full", config.dot)} />
      <span className={cn("text-xs font-bold", config.text)}>{count}</span>
      <span className={cn("text-[10px] uppercase tracking-wider font-semibold opacity-70", config.text)}>
        {status.replace('_', ' ')}
      </span>
    </div>
  );
}

function Separator({ orientation = 'horizontal', className }) {
  return (
    <div className={cn(
      "bg-slate-200",
      orientation === 'horizontal' ? "h-[1px] w-full" : "w-[1px] h-full",
      className
    )} />
  );
}
