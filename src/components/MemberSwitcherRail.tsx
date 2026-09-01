import React from 'react';
import { useHealthStore } from '../store';
import { Heart, Plus, Users } from 'lucide-react';

interface MemberSwitcherRailProps {
  onAddMember?: () => void;
  showAddButton?: boolean;
}

export const MemberSwitcherRail: React.FC<MemberSwitcherRailProps> = ({ 
  onAddMember,
  showAddButton = false
}) => {
  const { profiles, activeProfileId, setActiveProfileId, elderMode } = useHealthStore();

  // Ensure 'self' is first
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.relation === 'self') return -1;
    if (b.relation === 'self') return 1;
    return 0;
  });

  const isAllSelected = activeProfileId === 'all';

  return (
    <div className="w-full bg-white border-b border-gray-100 select-none">
      <div className="flex items-center space-x-3.5 overflow-x-auto scrollbar-hide py-2 px-3.5">
        {/* 最左侧：全部 (展示所有人) */}
        <button
          onClick={() => setActiveProfileId('all')}
          className="flex flex-col items-center flex-shrink-0 group cursor-pointer transition-transform active:scale-95 my-0.5"
        >
          <div className="p-0.5">
            <div
              className={`rounded-full transition-all duration-200 flex items-center justify-center ${
                elderMode ? 'w-12 h-12' : 'w-10 h-10'
              } ${
                isAllSelected
                  ? 'bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white ring-2 ring-[#0D9488] ring-offset-2 ring-offset-white shadow-sm'
                  : 'bg-teal-50/70 text-teal-800 border border-teal-200/80 hover:bg-teal-100/80'
              }`}
            >
              <Users className={`${elderMode ? 'w-6 h-6' : 'w-5 h-5'} stroke-[2.2]`} />
            </div>
          </div>
          <span
            className={`mt-0.5 text-xs truncate max-w-[70px] ${
              elderMode ? 'text-sm' : 'text-[11px]'
            } ${
              isAllSelected
                ? 'text-[#0D9488] font-black'
                : 'text-gray-500 font-medium'
            }`}
          >
            全部
          </span>
        </button>

        {sortedProfiles.map((p) => {
          const isSelected = p.id === activeProfileId;
          return (
            <button
              key={p.id}
              onClick={() => setActiveProfileId(p.id)}
              className="flex flex-col items-center flex-shrink-0 group cursor-pointer transition-transform active:scale-95 my-0.5"
            >
              <div className="p-0.5">
                <div
                  className={`rounded-full overflow-hidden transition-all duration-200 flex items-center justify-center relative ${
                    elderMode ? 'w-12 h-12' : 'w-10 h-10'
                  } ${
                    isSelected
                      ? 'ring-2 ring-[#059669] ring-offset-2 ring-offset-white shadow-sm'
                      : 'border border-gray-200 opacity-90 group-hover:opacity-100'
                  }`}
                  style={{ backgroundColor: p.avatarColor || '#059669' }}
                >
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-white text-xs font-bold">
                      {p.name.slice(0, 1)}
                    </span>
                  )}
                </div>

                {/* 被关爱角色爱心标识 */}
                {p.role === 'cared' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center border border-white shadow-xs">
                    <Heart className="w-2 h-2 text-white fill-white" />
                  </div>
                )}
              </div>

              <span
                className={`mt-0.5 text-xs truncate max-w-[70px] ${
                  elderMode ? 'text-sm' : 'text-[11px]'
                } ${
                  isSelected
                    ? 'text-[#059669] font-bold'
                    : 'text-gray-500 font-medium'
                }`}
              >
                {p.name}
              </span>
            </button>
          );
        })}

        {showAddButton && onAddMember && (
          <button
            onClick={onAddMember}
            className="flex flex-col items-center flex-shrink-0 cursor-pointer active:scale-95"
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-emerald-400 bg-emerald-50/50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <span className="mt-1 text-[11px] text-emerald-600 font-medium">添加</span>
          </button>
        )}
      </div>
    </div>
  );
};
