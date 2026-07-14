import { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

const materials = [
  {
    id: 1,
    title: 'Java',
    description: 'Premium handwritten study guide covering core Java concepts, OOPs, Collections, and Multithreading.',
    gradient: 'from-[#8B5CF6] to-[#6366F1]',
    shadow: 'shadow-indigo-500/30',
    fileName: '01_Java_Study_Material.pdf',
  },
  {
    id: 2,
    title: 'DSA',
    description: 'Comprehensive study notes covering all standard Data Structures and Algorithms with code templates.',
    gradient: 'from-[#F472B6] to-[#E11D48]',
    shadow: 'shadow-pink-500/30',
    fileName: '02_DSA_Study_Material.pdf',
  },
  {
    id: 3,
    title: 'Operating System',
    description: 'In-depth notes on Processes, Threads, Memory Management, File Systems, and Concurrency.',
    gradient: 'from-[#22D3EE] to-[#0EA5E9]',
    shadow: 'shadow-cyan-500/30',
    fileName: '04_Operating_Systems_Study_Material.pdf',
  },
  {
    id: 4,
    title: 'Computer Network',
    description: 'Detailed study materials on OSI Model, TCP/IP, Routing, Switching, and Network Security.',
    gradient: 'from-[#FBBF24] to-[#F59E0B]',
    shadow: 'shadow-amber-500/30',
    fileName: '03_Computer_Networks_Study_Material.pdf',
  },
  {
    id: 5,
    title: 'System Design',
    description: 'High-level architectures, scaling, databases, caching, and real-world case studies.',
    gradient: 'from-[#34D399] to-[#10B981]',
    shadow: 'shadow-emerald-500/30',
    fileName: '05_System_Design_Study_Material.pdf',
  },
  {
    id: 6,
    title: 'QA Testing',
    description: 'Quality Assurance and Software Testing concepts, manual and automated testing methodologies, and interview prep.',
    gradient: 'from-[#FB7185] to-[#F43F5E]',
    shadow: 'shadow-rose-500/30',
    fileName: '06_QA_Testing_Study_Material.pdf',
  },
];

export default function StudyMaterialsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const getPdfUrl = (fileName: string) => {
    const baseUrl = api.defaults.baseURL || 'http://localhost:5000/api';
    return `${baseUrl}/study_materials/${fileName}`;
  };

  const filteredMaterials = materials.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-[2.5rem] font-extrabold tracking-tight text-gray-900 leading-tight">
            Study Materials
          </h1>
          <p className="text-gray-500 text-lg mt-1 font-medium">
            Curated learning resources to accelerate your growth.
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            className="pl-11 h-12 bg-white border-gray-200 rounded-2xl shadow-sm text-base focus-visible:ring-indigo-500 focus-visible:border-indigo-500" 
            placeholder="Search materials..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredMaterials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((item) => (
            <div 
              key={item.id} 
              className={`relative overflow-hidden rounded-[2rem] p-8 bg-gradient-to-br ${item.gradient} text-white shadow-lg ${item.shadow} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group`}
            >
              {/* Soft background shape overlay */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 rounded-full bg-white/10 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                {/* Icon */}
                <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                
                <h3 className="text-2xl font-extrabold mb-2">{item.title}</h3>
                <p className="text-white/80 leading-relaxed font-medium mb-8 flex-1">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                    Complete PDF
                  </span>
                  <a 
                    href={getPdfUrl(item.fileName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm text-center inline-block cursor-pointer"
                  >
                    View
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 font-medium">
          No study materials found matching "{searchTerm}"
        </div>
      )}
      
    </div>
  );
}
