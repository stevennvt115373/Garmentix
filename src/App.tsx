import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, RotateCcw, Copy, CheckCircle2, DollarSign, Package, Scissors, Layers, Shirt } from 'lucide-react';

const PRODUCT_TYPES: Record<string, { cmt: number; consumption: number }> = {
  'T-shirt': { cmt: 1.20, consumption: 0.22 },
  'Polo Shirt': { cmt: 1.50, consumption: 0.28 },
  'Shirt (Woven)': { cmt: 2.20, consumption: 0.30 },
  'Pants': { cmt: 2.50, consumption: 0.55 },
  'Shorts': { cmt: 1.80, consumption: 0.40 },
  'Jacket': { cmt: 4.00, consumption: 0.75 },
  'Hoodie': { cmt: 3.20, consumption: 0.65 },
  'Sweater': { cmt: 3.50, consumption: 0.60 },
  'Sportswear': { cmt: 2.80, consumption: 0.45 },
};

const FABRIC_TYPES = [
  'Cotton', 'Cotton Spandex', 'Polyester', 'Polyester Spandex',
  'French Terry', 'Fleece', 'Jersey', 'Interlock', 'Nylon'
];

const MARKETS = ['US', 'UK', 'Asian', 'AU'];
const FIT_TYPES = ['Regular', 'Slim', 'Oversized'];

const TRIMS: Record<string, number> = {
  'Neck Label': 0.05,
  'Care Label': 0.04,
  'Hang Tag': 0.08,
  'Drawstring': 0.15,
  'Zipper': 0.35,
  'Buttons': 0.10,
  'Embroidery': 0.50,
  'Screen Printing': 0.40,
  'Heat Transfer': 0.35,
  'Woven Patch': 0.45,
  'Silicone Logo': 0.55,
};

const OVERHEAD = {
  qc: 0.10,
  packing: 0.20,
  polybag: 0.15,
  management: 0.25,
};
const TOTAL_OVERHEAD = Object.values(OVERHEAD).reduce((a, b) => a + b, 0);

const MARGINS = [0.10, 0.15, 0.20, 0.25, 0.30];

const getQuantityAdjustment = (qty: number) => {
  if (qty < 1000) return 0.10;
  if (qty < 3000) return 0;
  if (qty < 5000) return -0.05;
  if (qty < 10000) return -0.08;
  return -0.12;
};

const getSizeAdjustment = (market: string) => {
  if (['US', 'UK', 'AU'].includes(market)) return 0.08;
  return 0;
};

export default function App() {
  // Basic Product Info
  const [productType, setProductType] = useState('T-shirt');
  const [quantity, setQuantity] = useState<number>(1000);
  const [market, setMarket] = useState('US');
  const [fitType, setFitType] = useState('Regular');

  // Fabric Information
  const [fabricType, setFabricType] = useState('Cotton');
  const [fabricGsm, setFabricGsm] = useState<number>(180);
  const [fabricPrice, setFabricPrice] = useState<number>(5.50);
  const [fabricConsumption, setFabricConsumption] = useState<number>(PRODUCT_TYPES['T-shirt'].consumption);
  const [isConsumptionEdited, setIsConsumptionEdited] = useState(false);

  // Manufacturing
  const [cmtCost, setCmtCost] = useState<number>(PRODUCT_TYPES['T-shirt'].cmt);
  const [isCmtEdited, setIsCmtEdited] = useState(false);

  // Trims & Accessories
  const [selectedTrims, setSelectedTrims] = useState<Record<string, boolean>>({});
  const [trimPrices, setTrimPrices] = useState<Record<string, number>>(TRIMS);

  // Margin
  const [margin, setMargin] = useState(0.20);

  // UI State
  const [copied, setCopied] = useState(false);

  // Update default consumption when product type changes (if not manually edited)
  useEffect(() => {
    if (!isConsumptionEdited) {
      setFabricConsumption(PRODUCT_TYPES[productType].consumption);
    }
    if (!isCmtEdited) {
      setCmtCost(PRODUCT_TYPES[productType].cmt);
    }
  }, [productType, isConsumptionEdited, isCmtEdited]);

  const handleConsumptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFabricConsumption(parseFloat(e.target.value) || 0);
    setIsConsumptionEdited(true);
  };

  const handleTrimToggle = (trim: string) => {
    setSelectedTrims(prev => ({
      ...prev,
      [trim]: !prev[trim]
    }));
  };

  const resetForm = () => {
    setProductType('T-shirt');
    setQuantity(1000);
    setMarket('US');
    setFitType('Regular');
    setFabricType('Cotton');
    setFabricGsm(180);
    setFabricPrice(5.50);
    setFabricConsumption(PRODUCT_TYPES['T-shirt'].consumption);
    setIsConsumptionEdited(false);
    setCmtCost(PRODUCT_TYPES['T-shirt'].cmt);
    setIsCmtEdited(false);
    setSelectedTrims({});
    setTrimPrices(TRIMS);
    setMargin(0.20);
  };

  // Calculations
  const results = useMemo(() => {
    const sizeAdj = getSizeAdjustment(market);
    const adjustedConsumption = fabricConsumption * (1 + sizeAdj);
    const fabricCost = adjustedConsumption * fabricPrice;
    
    const trimCost = Object.entries(selectedTrims).reduce((total, [trim, isSelected]) => {
      return total + (isSelected ? trimPrices[trim] : 0);
    }, 0);
    
    const overheadCost = TOTAL_OVERHEAD;
    
    const baseTotalCost = fabricCost + trimCost + cmtCost + overheadCost;
    const qtyAdj = getQuantityAdjustment(quantity);
    const adjustedTotalCost = baseTotalCost * (1 + qtyAdj);
    
    const fobPrice = adjustedTotalCost * (1 + margin);
    const totalOrderValue = fobPrice * quantity;

    return {
      adjustedConsumption,
      fabricCost,
      trimCost,
      cmtCost,
      overheadCost,
      baseTotalCost,
      qtyAdj,
      adjustedTotalCost,
      fobPrice,
      totalOrderValue
    };
  }, [productType, quantity, market, fabricConsumption, fabricPrice, selectedTrims, margin, cmtCost, trimPrices]);

  const exportText = `Quotation Summary
-----------------
Product: ${productType}
Quantity: ${quantity.toLocaleString()} pcs
Target Market: ${market} (${fitType} Fit)
Fabric: ${fabricType} ${fabricGsm}gsm

Cost Breakdown (per piece):
- Fabric Cost: $${results.fabricCost.toFixed(2)}
- Trim Cost: $${results.trimCost.toFixed(2)}
- Manufacturing (CMT): $${results.cmtCost.toFixed(2)}
- Overhead: $${results.overheadCost.toFixed(2)}

Total Cost per Piece: $${results.adjustedTotalCost.toFixed(2)}
Final FOB Price: $${results.fobPrice.toFixed(2)} / pcs
Total Order Value: $${results.totalOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Calculator size={20} />
            </div>
            <h1 className="text-xl font-semibold text-slate-800">Garment Pricing Calculator</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form Inputs */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Basic Product Info */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Shirt size={18} className="text-indigo-500" />
                <h2 className="text-lg font-medium text-slate-800">Basic Product Info</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Type</label>
                  <select 
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {Object.keys(PRODUCT_TYPES).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Order Quantity (PCS)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Market / Size Standard</label>
                  <select 
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {MARKETS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fit Type</label>
                  <select 
                    value={fitType}
                    onChange={(e) => setFitType(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {FIT_TYPES.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Manufacturing Cost (CMT)
                    {isCmtEdited && <span className="ml-2 text-xs text-amber-600 font-normal">(Edited)</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">$</span>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={cmtCost}
                      onChange={(e) => {
                        setCmtCost(parseFloat(e.target.value) || 0);
                        setIsCmtEdited(true);
                      }}
                      className="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Fabric Information */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Layers size={18} className="text-indigo-500" />
                <h2 className="text-lg font-medium text-slate-800">Fabric Information</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fabric Type</label>
                  <select 
                    value={fabricType}
                    onChange={(e) => setFabricType(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {FABRIC_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fabric GSM</label>
                  <input 
                    type="number" 
                    min="50"
                    value={fabricGsm}
                    onChange={(e) => setFabricGsm(parseInt(e.target.value) || 0)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fabric Price per KG (USD)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">$</span>
                    </div>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={fabricPrice}
                      onChange={(e) => setFabricPrice(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fabric Consumption (KG/pc)
                    {isConsumptionEdited && <span className="ml-2 text-xs text-amber-600 font-normal">(Edited)</span>}
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={fabricConsumption}
                    onChange={handleConsumptionChange}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Trims & Accessories */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Scissors size={18} className="text-indigo-500" />
                <h2 className="text-lg font-medium text-slate-800">Trim & Accessories</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(TRIMS).map(([trim, defaultPrice]) => (
                    <div key={trim} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${selectedTrims[trim] ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={!!selectedTrims[trim]}
                          onChange={() => handleTrimToggle(trim)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">{trim}</span>
                      </label>
                      {selectedTrims[trim] ? (
                        <div className="flex items-center gap-1 w-20">
                          <span className="text-slate-500 text-xs">$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={trimPrices[trim]}
                            onChange={(e) => setTrimPrices(prev => ({ ...prev, [trim]: parseFloat(e.target.value) || 0 }))}
                            className="w-full text-xs rounded border border-slate-300 px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">+${trimPrices[trim].toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Profit Margin */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <DollarSign size={18} className="text-indigo-500" />
                <h2 className="text-lg font-medium text-slate-800">Profit Margin</h2>
              </div>
              <div className="p-6">
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target Margin</label>
                  <select 
                    value={margin}
                    onChange={(e) => setMargin(parseFloat(e.target.value))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {MARGINS.map(m => (
                      <option key={m} value={m}>{(m * 100).toFixed(0)}%</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

          </div>

          {/* Right Column: Results & Export */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              
              {/* Results Card */}
              <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden text-white">
                <div className="p-6 border-b border-slate-800">
                  <h2 className="text-lg font-medium text-slate-100 mb-4">Cost Breakdown</h2>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Fabric Cost</span>
                      <span className="font-mono">${results.fabricCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Trim Cost</span>
                      <span className="font-mono">${results.trimCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Manufacturing (CMT)</span>
                      <span className="font-mono">${results.cmtCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Overhead Cost</span>
                      <span className="font-mono">${results.overheadCost.toFixed(2)}</span>
                    </div>
                    
                    <div className="pt-3 mt-3 border-t border-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Base Cost / pc</span>
                        <span className="font-mono">${results.baseTotalCost.toFixed(2)}</span>
                      </div>
                      {results.qtyAdj !== 0 && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-slate-400">Qty Adj. ({(results.qtyAdj > 0 ? '+' : '') + (results.qtyAdj * 100).toFixed(0)}%)</span>
                          <span className="font-mono text-amber-400">
                            {(results.qtyAdj > 0 ? '+' : '')}${(results.baseTotalCost * results.qtyAdj).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-indigo-600">
                  <div className="flex flex-col gap-1">
                    <span className="text-indigo-200 text-sm font-medium uppercase tracking-wider">Final FOB Price</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight">${results.fobPrice.toFixed(2)}</span>
                      <span className="text-indigo-200">/ pcs</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-indigo-500/50 flex flex-col gap-1">
                    <span className="text-indigo-200 text-sm font-medium uppercase tracking-wider">Total Order Value</span>
                    <span className="text-2xl font-semibold tracking-tight">
                      ${results.totalOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Export Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-800 flex items-center gap-2">
                    <Package size={16} className="text-slate-500" />
                    Quotation Summary
                  </h3>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                    {exportText}
                  </pre>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
