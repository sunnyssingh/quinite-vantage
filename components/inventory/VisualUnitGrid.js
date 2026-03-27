'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Building2, 
  Layers, 
  Info, 
  MoreVertical,
  Edit,
  Trash2,
  LandPlot,
  X,
  Zap,
  Trash,
  ChevronRight,
  ShieldCheck,
  LayoutGrid,
  Settings2,
  ArrowRight
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventory, useUnitConfigs } from '@/hooks/useInventory';
import { 
  formatINR, 
  getInventoryStats, 
  getStatusConfig,
  buildEmptyFloorSlots 
} from '@/lib/inventory';
import UnitDrawer from './UnitDrawer';
import TowerDrawer from './TowerDrawer';
import FloorPlanLand from './FloorPlanLand';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function VisualUnitGrid({ projectId, project, organizationId, readOnly = false }) {
  const projectType = project?.metadata?.real_estate?.property?.category || project?.category || 'residential';
  
  const { 
    towers = [], 
    units = {}, 
    isLoading, 
    addTower, 
    updateTower, 
    deleteTower,
    addUnit, 
    updateUnit, 
    deleteUnit,
    updateUnitStatus,
  } = useInventory({ projectId, organizationId });

  const { data: unitConfigs = [], isLoading: configsLoading } = useUnitConfigs(projectId);
  
  const [activeTowerId, setActiveTowerId] = useState(null);
  const [selectedConfig, setSelectedConfig] = useState(null); 
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [targetFloor, setTargetFloor] = useState(null);

  useEffect(() => {
    if (towers.length > 0 && !activeTowerId) {
      setActiveTowerId(towers[0].id);
    }
  }, [towers, activeTowerId]);

  const activeTower = towers.find(t => t.id === activeTowerId);
  const towerUnits = units[activeTowerId] || [];
  const unassignedUnits = units['unassigned'] || [];

  const unitCountsByConfig = useMemo(() => {
    const allUnits = Object.values(units).flat();
    return allUnits.reduce((acc, unit) => {
      const configId = unit.config_id;
      if (configId) {
        acc[configId] = (acc[configId] || 0) + 1;
      }
      return acc;
    }, {});
  }, [units]);

  const stats = useMemo(() => getInventoryStats(towerUnits), [towerUnits]);

  const handlePaintUnit = async (floorNum) => {
    if (!selectedConfig) return;
    try {
      const currentFloorUnits = towerUnits.filter(u => Number(u.floor_number) === Number(floorNum));
      const nextIndex = currentFloorUnits.length;
      
      await addUnit({
        tower_id: activeTowerId,
        project_id: projectId,
        organization_id: organizationId,
        floor_number: floorNum,
        config_id: selectedConfig.id,
        unit_number: generateUnitNumber(activeTower?.name, floorNum, nextIndex),
        status: 'available',
        carpet_area: selectedConfig.carpet_area || 0,
        built_up_area: selectedConfig.builtup_area || 0,
        super_built_up_area: selectedConfig.super_builtup_area || 0,
        plot_area: selectedConfig.plot_area || 0,
        base_price: selectedConfig.base_price || 0,
        facing: 'North',
      });
      return true;
    } catch (error) {
      console.error('Painting error:', error);
      return false;
    }
  };

  const handleFillFloor = async (floorNum) => {
    if (!selectedConfig) return;
    const slots = buildEmptyFloorSlots(activeTower, towerUnits, floorNum);
    const emptySlotIndices = slots.reduce((acc, unit, idx) => {
      if (!unit) acc.push(idx);
      return acc;
    }, []);

    if (emptySlotIndices.length === 0) return;
    let addedCount = 0;
    const toastId = toast.loading(`Initializing level ${floorNum}...`);
    for (const slotIdx of emptySlotIndices) {
      const success = await handlePaintUnit(floorNum, slotIdx);
      if (success) addedCount++;
      else break; 
    }
    toast.success(`Synthesized ${addedCount} units.`, { id: toastId });
  };

  const handleOpenAddUnit = (floorNum) => {
    if (selectedConfig) {
       handlePaintUnit(floorNum);
    } else {
       setTargetFloor(floorNum);
       setDrawerMode('add_unit');
       setSelectedUnit(null);
       setDrawerOpen(true);
    }
  };

  const handleEditUnit = (unit) => {
    setSelectedUnit(unit);
    setTargetFloor(unit.floor_number);
    setDrawerMode('edit_unit');
    setDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-10 bg-white rounded-3xl border border-slate-100 min-h-[600px]">
        <div className="flex justify-between items-center mb-10">
            <div className="flex gap-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-32 rounded-xl" />)}
            </div>
            <Skeleton className="h-12 w-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (projectType === 'land') {
     return <FloorPlanLand 
        projectId={projectId} 
        project={project} 
        units={Object.values(units).flat()} 
        organizationId={organizationId} 
        onAddUnit={addUnit}
        onUpdateUnit={updateUnit}
        onDeleteUnit={deleteUnit}
     />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-100 rounded-[40px] border border-slate-200 overflow-hidden shadow-2xl min-h-[750px] relative">
      {/* Sidebar: Config Engine */}
      <aside className="w-full lg:w-80 bg-white border-r border-slate-100 flex flex-col shrink-0 z-20 shadow-xl lg:shadow-none">
        <div className="p-8 pb-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Model Profiles</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Catalog Library</h3>
        </div>
        
        <div className="flex-1 overflow-auto px-4 py-4 space-y-6 custom-scrollbar">
            <div className="space-y-3">
              {unitConfigs.length > 0 ? unitConfigs.map((config) => {
                const isSelected = selectedConfig?.id === config.id;
                const placed = unitCountsByConfig[config.id] || 0;

                return (
                  <div 
                    key={config.id}
                    onClick={() => setSelectedConfig(isSelected ? null : config)}
                    className={cn(
                      "group p-4 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden",
                      isSelected 
                        ? "border-slate-950 bg-slate-950 text-white shadow-2xl translate-x-1" 
                        : "border-slate-50 bg-slate-50/50 hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                       <div className={cn(
                         "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                         isSelected ? "bg-white/10" : "bg-white shadow-sm"
                       )}>
                          <Layers className={cn("w-5 h-5", isSelected ? "text-white" : "text-slate-300")} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-50", isSelected ? "text-white/60" : "text-slate-400")}>
                            {config.property_type}
                          </p>
                          <h4 className="text-sm font-black tracking-tight truncate">
                            {config.config_name}
                          </h4>
                          <div className="flex items-center justify-between mt-2">
                            <span className={cn("text-[10px] font-black leading-none", isSelected ? "text-white" : "text-slate-900")}>
                                {formatINR(config.base_price)}
                            </span>
                            <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", isSelected ? "bg-white/10 border-white/10" : "bg-white border-slate-100")}>
                                {placed} PLACED
                            </span>
                          </div>
                       </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-10 px-6 border-2 border-dashed rounded-[32px] bg-slate-50 border-slate-100">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed italic">Prototypes Empty</p>
                </div>
              )}
            </div>
        </div>
        
        {/* Fill Legend */}
        {selectedConfig && (
            <div className="p-6 bg-blue-600 animate-in slide-in-from-bottom duration-500 m-4 rounded-[32px] shadow-2xl shadow-blue-200">
                <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-5 h-5 text-white animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Quick-Sync Active</span>
                </div>
                <p className="text-xs font-bold text-white/80 leading-relaxed">
                    Click any open slot in the matrix to deploy <span className="text-white underline">{selectedConfig.config_name}</span>.
                </p>
                <Button onClick={() => setSelectedConfig(null)} className="w-full mt-4 bg-white text-blue-600 hover:bg-blue-50 font-black uppercase text-[10px] tracking-widest h-10 rounded-xl">Disable Engine</Button>
            </div>
        )}
      </aside>

      {/* Primary Workspace */}
      <div className="flex-1 flex flex-col pt-4">
        {/* Workspace Toolbar */}
        <div className="px-8 py-4 flex items-center justify-between bg-white mx-4 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {towers.map(tower => (
              <Button
                key={tower.id}
                variant="ghost"
                onClick={() => setActiveTowerId(tower.id)}
                className={cn(
                  "px-6 h-12 transition-all rounded-2xl font-black uppercase text-[10px] tracking-widest",
                  activeTowerId === tower.id 
                    ? "bg-slate-950 text-white shadow-xl shadow-slate-200" 
                    : "text-slate-400 hover:bg-slate-50"
                )}
              >
                {tower.name}
              </Button>
            ))}
            <Button variant="outline" className="h-12 w-12 rounded-2xl border-slate-100 text-blue-600 hover:bg-blue-50" onClick={() => { setDrawerMode('add_tower'); setDrawerOpen(true); }}>
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none mb-1">Matrix Volume</span>
                <span className="text-lg font-black text-slate-900 leading-none">{stats.total} UNITS</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-slate-50 hover:bg-slate-100">
                  <Settings2 className="w-5 h-5 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl w-48 p-2">
                <DropdownMenuItem className="p-3 font-bold cursor-pointer rounded-xl flex justify-between" onClick={() => { setSelectedUnit(null); setDrawerMode('edit_tower'); setDrawerOpen(true); }}>
                  Configure Tower <Edit className="w-4 h-4 ml-2" />
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem className="p-3 font-bold cursor-pointer rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 flex justify-between" onClick={() => deleteTower(activeTowerId)}>
                  Decommission <Trash2 className="w-4 h-4" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* The Matrix */}
        <div className="flex-1 overflow-auto p-8 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto space-y-12 pb-32">
            <div className="space-y-6">
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
                    onFillFloor={() => handleFillFloor(floorNum)}
                    paintingActive={!!selectedConfig}
                  />
                ))
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-[40px] border-4 border-dashed border-slate-100 mx-auto">
                  <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 border border-slate-50">
                    <Building2 className="w-12 h-12 text-slate-200" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight">Deployment Pending</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">Ready to initialize structural mapping for this project.</p>
                  <Button onClick={() => { setDrawerMode('add_tower'); setDrawerOpen(true); }} className="mt-10 bg-slate-900 text-white rounded-2xl h-14 px-10 font-black uppercase text-xs tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95">Initialize Tower Matrix</Button>
                </div>
              )}
            </div>

            {/* Float Assets */}
            {unassignedUnits.length > 0 && (
              <div className="pt-20 border-t border-slate-200 border-dashed">
                 <div className="flex items-center gap-4 mb-8 px-4">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-600 shadow-xl shadow-emerald-100 flex items-center justify-center text-white">
                     <LandPlot className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">Unassigned Assets</h3>
                     <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Inventory not mapped to structural grid</p>
                   </div>
                 </div>
                 
                 <div className="flex gap-4 overflow-x-auto pb-10 px-4 group/unassigned">
                    {unassignedUnits.map(unit => (
                      <div key={unit.id} className="min-w-[130px] max-w-[130px]">
                        <UnitCell unit={unit} onClick={() => handleEditUnit(unit)} onStatusChange={updateUnitStatus} onDelete={() => deleteUnit(unit.id)} />
                      </div>
                    ))}
                    <button 
                      onClick={() => { setTargetFloor(null); setDrawerMode('add_plot'); setSelectedUnit(null); setDrawerOpen(true); }}
                      className="h-[100px] min-w-[130px] rounded-3xl border-2 border-dashed border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50 transition-all flex flex-col items-center justify-center text-slate-400 hover:text-emerald-500 group/newplot"
                    >
                       <Plus className="w-5 h-5 mb-2 group-hover/newplot:scale-110 transition-transform" />
                       <span className="text-[9px] font-bold uppercase tracking-widest">Add Asset</span>
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UnitDrawer 
        open={drawerOpen && (drawerMode?.includes('unit') || drawerMode === 'add_plot')}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode?.includes('add') ? 'add' : 'edit'}
        unit={selectedUnit}
        tower={drawerMode === 'add_plot' ? null : activeTower}
        projectType={drawerMode === 'add_plot' ? 'land' : projectType}
        unitConfigs={unitConfigs}
        floorNumber={targetFloor}
        towerId={drawerMode === 'add_plot' ? null : activeTowerId}
        projectId={projectId}
        organizationId={organizationId}
        onSave={drawerMode?.includes('add') ? addUnit : (data) => updateUnit(selectedUnit.id, data)}
        onDelete={deleteUnit}
      />
      
      <TowerDrawer 
        open={drawerOpen && (drawerMode?.includes('tower'))}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode === 'add_tower' ? 'add' : 'edit'}
        tower={activeTower}
        projectId={projectId}
        organizationId={organizationId}
        onSave={drawerMode === 'add_tower' ? addTower : (data) => updateTower(activeTowerId, data)}
        onDelete={deleteTower}
      />
    </div>
  );
}

function FloorRow({ floorNum, tower, units, onUnitClick, onAddUnit, onStatusChange, onDeleteUnit, onFillFloor, paintingActive }) {
  const slots = useMemo(() => buildEmptyFloorSlots(tower, units, floorNum), [tower, units, floorNum]);
  const isGround = floorNum === 0;

  return (
    <div className="flex items-start gap-4 group/row max-w-full">
      <div className="w-20 pt-2 shrink-0 flex flex-col items-center">
        <div className={cn(
          "w-12 h-12 flex items-center justify-center rounded-2xl border-2 shadow-sm transition-all group-hover/row:scale-110 group-hover/row:shadow-md",
          isGround ? "bg-slate-900 border-slate-950 text-white" : "bg-white border-slate-100 text-slate-400"
        )}>
          <span className="text-sm font-black tracking-tighter">{isGround ? 'G' : `F${floorNum}`}</span>
        </div>
        {paintingActive && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onFillFloor(); }}
            className="text-[9px] font-black uppercase text-blue-600 h-6 px-3 mt-3 opacity-0 group-hover/row:opacity-100 transition-all bg-blue-50/50 hover:bg-blue-600 hover:text-white rounded-lg"
          >
            Deploy Full
          </Button>
        )}
      </div>

      <div className="flex gap-3 pb-4 flex-1 overflow-x-auto custom-scrollbar pt-2 scroll-smooth no-scrollbar select-none">
        {slots.map((unit, idx) => (
          <div key={idx} className="shrink-0 min-w-[130px] max-w-[130px]">
            {unit ? (
              <UnitCell unit={unit} onClick={() => onUnitClick(unit)} onStatusChange={onStatusChange} onDelete={() => onDeleteUnit(unit.id)} />
            ) : (
              <div 
                onClick={() => onAddUnit(floorNum)}
                className="h-[100px] rounded-3xl border-2 border-dashed border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50/20 transition-all flex items-center justify-center cursor-pointer group/box shadow-sm"
              >
                 <Plus className="w-5 h-5 text-slate-100 group-hover/box:text-blue-500 transition-all scale-90 group-hover/box:rotate-90 group-hover/box:scale-110" />
              </div>
            )}
          </div>
        ))}
        <div className="shrink-0 flex items-center pt-2 px-2">
           <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-2xl opacity-0 group-hover/row:opacity-100 transition-all bg-white border border-slate-100 shadow-xl hover:bg-slate-900 hover:text-white"
            onClick={() => onAddUnit(floorNum)}
           >
             <Plus className="w-5 h-5" />
           </Button>
        </div>
      </div>
    </div>
  );
}

function UnitCell({ unit, onClick, onStatusChange, onDelete }) {
  const style = getStatusConfig(unit.status);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            onClick={onClick}
            className={cn(
              "p-4 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden h-[100px] flex flex-col justify-between shadow-sm group/cell",
              style.bg,
              style.border,
              "hover:shadow-2xl hover:scale-[1.05] active:scale-95 border-0 shadow-lg"
            )}
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <span className={cn(
                "text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm border border-black/5 flex items-center gap-1", 
                style.bg === 'bg-white' ? "bg-slate-50 border-slate-100 text-slate-400" : "bg-white/40 border-white/10", 
                style.text
              )}>
                {unit.unit_number}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1 rounded-lg text-slate-300 hover:bg-red-500 hover:text-white opacity-0 group-hover/cell:opacity-100 transition-all"
              >
                <Trash className="w-3 h-3" />
              </button>
            </div>

            {/* Content Overflow */}
            <div className="flex-1 flex flex-col justify-end mt-1 overflow-hidden">
                <div className={cn("text-xs font-black tracking-tight leading-none mb-1", style.text)}>
                  {formatINR(unit.total_price || unit.base_price)}
                </div>
                <div className={cn("text-[8px] font-bold uppercase truncate opacity-50", style.text)}>
                    {unit.config?.config_name || unit.config_id?.slice(0, 8)}
                </div>
            </div>

            {/* Grid Icon / Status Dot */}
            <div className="absolute top-1/2 -right-4 w-12 h-12 bg-white/5 rounded-full blur-xl pointer-events-none" />
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-black/5 overflow-hidden">
               <span className={cn("text-[7px] font-black uppercase tracking-[0.15em] opacity-40 leading-none", style.text)}>
                {unit.facing || 'NORTH'}
               </span>
               <div className={cn("w-1.5 h-1.5 rounded-full", style.dot)} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={10} className="p-0 border-0 bg-white shadow-2xl rounded-3xl z-50 overflow-hidden min-w-[240px]">
           <div className="p-4 bg-slate-900 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                 <div className="p-1 px-2 border border-white/20 rounded-lg">
                    <span className="text-xs font-black">{unit.unit_number}</span>
                 </div>
                 <h5 className="text-[10px] font-black uppercase tracking-widest opacity-60">Listing Node</h5>
              </div>
              <Badge className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-md", style.bg, style.text, "border-0")}>
                {unit.status}
              </Badge>
           </div>
           <div className="p-6 space-y-4">
              <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                  <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Configuration</p>
                      <h4 className="text-sm font-black text-slate-900 leading-none">{unit.config?.config_name || 'Legacy Config'}</h4>
                  </div>
                  <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valuation</p>
                      <h4 className="text-sm font-black text-blue-600 leading-none">{formatINR(unit.total_price || unit.base_price)}</h4>
                  </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                      <Scaling className="w-4 h-4 text-slate-300" />
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Area</p>
                        <p className="text-xs font-black text-slate-900 leading-none">{unit.carpet_area} <span className="text-[8px] opacity-40">SQFT</span></p>
                      </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                      <Compass className="w-4 h-4 text-slate-300" />
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Facing</p>
                        <p className="text-xs font-black text-slate-900 leading-none uppercase">{unit.facing || 'EAST'}</p>
                      </div>
                  </div>
              </div>
              
              <Button size="sm" className="w-full bg-slate-900 hover:bg-black font-black uppercase text-[10px] tracking-widest h-10 rounded-xl mt-2 flex gap-2">
                Open Full Control <ArrowRight className="w-3 h-3" />
              </Button>
           </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
