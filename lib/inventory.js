/**
 * Centralized helper functions for Inventory management
 */

export const STATUS_STYLES = {
  available:         { bg: 'bg-emerald-50',   border: 'border-emerald-300', text: 'text-emerald-800',  dot: 'bg-emerald-500'  },
  reserved:          { bg: 'bg-amber-50',     border: 'border-amber-300',   text: 'text-amber-800',    dot: 'bg-amber-500'    },
  sold:              { bg: 'bg-slate-100',    border: 'border-slate-300',   text: 'text-slate-500',    dot: 'bg-slate-400'    },
  blocked:           { bg: 'bg-red-50',       border: 'border-red-300',     text: 'text-red-800',      dot: 'bg-red-500'      },
  under_maintenance: { bg: 'bg-purple-50',    border: 'border-purple-300',  text: 'text-purple-800',   dot: 'bg-purple-400'   },
};

export function generateUnitNumber(towerName, floorNumber, slotIndex) {
  if (!towerName) return `${floorNumber}${String(slotIndex + 1).padStart(2, '0')}`;
  const towerPrefix = (towerName.replace(/[^A-Z]/gi, '').charAt(0) || towerName.charAt(0)).toUpperCase();
  const floor = String(floorNumber).padStart(2, '0');
  const slot = String(slotIndex + 1).padStart(2, '0');
  return `${towerPrefix}-${floor}${slot}`; 
}

export function formatINR(value) {
  if (value === undefined || value === null || isNaN(value)) return '—';
  const val = Number(value);
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

export function calculateFinalPrice(basePrice, floorRise, plc) {
  return (Number(basePrice) || 0) + (Number(floorRise) || 0) + (Number(plc) || 0);
}

export function getStatusConfig(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.available;
}

export function buildEmptyFloorSlots(tower, units, floorNumber) {
  if (!tower) return [];
  const defaultUnits = tower.units_per_floor || 4;
  const floorUnits = units.filter(u => Number(u.floor_number) === Number(floorNumber));
  
  // Find max slot index in this floor or default to units_per_floor
  const maxSlot = Math.max(
    defaultUnits - 1,
    ...floorUnits.map(u => u.slot_index || 0)
  );
  
  const slots = Array(maxSlot + 1).fill(null);
  
  floorUnits.forEach(unit => {
    if (unit.slot_index !== null) {
      slots[unit.slot_index] = unit;
    }
  });
  
  return slots;
}

export function getInventoryStats(units) {
  if (!Array.isArray(units)) {
    return { available: 0, reserved: 0, sold: 0, blocked: 0, under_maintenance: 0, total: 0, totalValue: 0 };
  }
  
  return units.reduce((acc, unit) => {
    const status = unit.status || 'available';
    acc[status] = (acc[status] || 0) + 1;
    acc.total += 1;
    acc.totalValue += Number(unit.price) || 0;
    return acc;
  }, { available: 0, reserved: 0, sold: 0, blocked: 0, under_maintenance: 0, total: 0, totalValue: 0 });
}

export function autoNameTower(existingTowers) {
  const count = (existingTowers || []).length;
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (count < 26) return `Tower ${letters[count]}`;
  return `Tower ${count + 1}`;
}
