import React, { useState } from 'react';
import { Palette, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

export const VisualColorTools: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'color' | 'qrcode'>('color');

  // Color state
  const [hexColor, setHexColor] = useState('#6366f1');

  // QRCode state
  const [qrText, setQrText] = useState('https://github.com');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const handleGenerateQr = async () => {
    try {
      const url = await QRCode.toDataURL(qrText, { width: 256, margin: 2 });
      setQrDataUrl(url);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Sub tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit shadow-xs">
        <button
          onClick={() => setActiveSubTab('color')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'color' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>颜色拾取与 HEX / RGB 换算</span>
        </button>
        <button
          onClick={() => setActiveSubTab('qrcode')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'qrcode' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>二维码生成器</span>
        </button>
      </div>

      {activeSubTab === 'color' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 max-w-xl shadow-xs">
          <div className="flex items-center gap-4">
            <input
              type="color"
              value={hexColor}
              onChange={(e) => setHexColor(e.target.value)}
              className="w-14 h-14 rounded-xl border border-slate-200 cursor-pointer bg-transparent"
            />
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 font-mono text-base">{hexColor.toUpperCase()}</span>
              <p className="text-[11px] text-slate-500 font-medium">点击左侧色块实时调色</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] font-sans font-medium">HEX 色值</span>
              <span className="text-blue-700 font-bold">{hexColor.toUpperCase()}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] font-sans font-medium">CSS 预览</span>
              <div className="w-full h-4 rounded border border-slate-200" style={{ backgroundColor: hexColor }} />
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'qrcode' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 max-w-xl shadow-xs">
          <div className="flex gap-2">
            <input
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              placeholder="输入文本或 URL..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
            <button
              onClick={handleGenerateQr}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              生成二维码
            </button>
          </div>

          {qrDataUrl && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 w-fit mx-auto shadow-md">
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
