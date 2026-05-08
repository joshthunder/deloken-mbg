import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';

// Sample provincial scores (0-100)
const provinceScores: Record<string, number> = {
  'ACEH': 85,
  'SUMATERA UTARA': 45,
  'JAWA BARAT': 92,
  'JAWA TENGAH': 78,
  'JAWA TIMUR': 88,
  'DKI JAKARTA': 95,
  'PAPUA': 55,
  'KALIMANTAN TIMUR': 72,
  // ... more can be added
};

const getColor = (score: number) => {
  if (score >= 80) return '#22C55E'; // Green
  if (score >= 60) return '#FACC15'; // Yellow
  if (score >= 40) return '#F97316'; // Orange
  return '#EF4444'; // Red
};

export default function IndonesiaHeatmap() {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    // Fetch common Indonesia GeoJSON
    fetch('https://raw.githubusercontent.com/superpikar/indonesia-geojson/master/indonesia-prov.json')
      .then(res => res.json())
      .then(data => setGeoData(data));
  }, []);

  const onEachProvince = (province: any, layer: L.Layer) => {
    const name = province.properties.Propinsi;
    const score = provinceScores[name] || 50; // default score

    layer.bindPopup(`
      <div class="p-2">
        <p class="font-bold text-lg mb-1">${name}</p>
        <div class="flex items-center gap-2">
           <span class="text-sm font-medium">Score:</span>
           <span class="font-bold px-2 py-0.5 rounded text-white" style="background: ${getColor(score)}">${score}</span>
        </div>
        <p class="text-xs text-gray-500 mt-2">Klik untuk detail provinsi</p>
      </div>
    `);

    if (layer instanceof L.Path) {
      layer.setStyle({
        fillColor: getColor(score),
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.7
      });

      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({ fillOpacity: 0.9, weight: 2 });
        },
        mouseout: (e) => {
          const l = e.target;
          l.setStyle({ fillOpacity: 0.7, weight: 1 });
        }
      });
    }
  };

  return (
    <div className="h-[500px] w-full rounded-3xl overflow-hidden border border-outline-variant shadow-sm bg-blue-50">
      <MapContainer 
        center={[-2.5489, 118.0149]} 
        zoom={5} 
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="grayscale opacity-50"
        />
        {geoData && (
          <GeoJSON 
            data={geoData} 
            onEachFeature={onEachProvince}
          />
        )}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-lg border border-outline-variant z-[1000] space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Indikator Performa</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success-green"></div>
            <span className="text-[10px] font-semibold">80-100 (Baik)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning-yellow"></div>
            <span className="text-[10px] font-semibold">60-79 (Cukup)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-[10px] font-semibold">40-59 (Kurang)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger-red"></div>
            <span className="text-[10px] font-semibold">0-39 (Buruk)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
