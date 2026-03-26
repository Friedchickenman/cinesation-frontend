"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface LoungeBoardProps {
    rooms: any[];
    myRooms: any[];
    isLoading: boolean;
    isMyRoomsLoading: boolean;
    session: any;
    onRequireLogin: () => void;
}

export default function LoungeBoard({ rooms, myRooms, isLoading, isMyRoomsLoading, session, onRequireLogin }: LoungeBoardProps) {
    const router = useRouter();
    const t = useTranslations("LoungeBoard"); // 🌟 번역기 장착!

    const [filterStatus, setFilterStatus] = useState("ALL");
    const [sortBy, setSortBy] = useState("LATEST");

    const getProcessedRooms = (roomList: any[], activeTab: string) => {
        let processed = [...roomList];
        if (activeTab === "all") {
            processed = processed.filter(room => filterStatus === "ALL" ? room.status === "OPEN" : room.status === filterStatus);
        } else {
            processed = processed.filter(room => filterStatus === "ALL" ? true : room.status === filterStatus);
        }
        processed.sort((a, b) => {
            if (sortBy === "LATEST") return b.id - a.id;
            if (sortBy === "OLDEST") return a.id - b.id;
            if (sortBy === "ACTIVE") {
                const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                return timeB - timeA;
            }
            return 0;
        });
        return processed;
    };

    const renderRoomCards = (roomList: any[], emptyMessage: string, activeTab: string) => {
        const processedRooms = getProcessedRooms(roomList, activeTab);

        if (processedRooms.length === 0) {
            return (
                <div className="py-24 text-center flex flex-col items-center justify-center bg-zinc-900/50 rounded-[2rem] border border-zinc-800 shadow-sm mt-4 w-full">
                    <p className="text-zinc-500 font-medium text-sm">{emptyMessage}</p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 mt-6 w-full">
                {processedRooms.map((room: any) => (
                    <div key={room.id} onClick={() => router.push(`/rooms/${room.id}`)} className="group flex flex-col bg-zinc-900/80 rounded-2xl border border-zinc-800/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:border-zinc-700 transition-all duration-300 cursor-pointer p-2 hover:-translate-y-1">
                        <div className="relative aspect-[2/3] bg-zinc-950 rounded-xl overflow-hidden mb-3 border border-zinc-800">
                            {room.poster_path ? (
                                <img src={`https://image.tmdb.org/t/p/w500${room.poster_path}`} alt={room.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                            ) : (
                                <span className="text-zinc-700 font-semibold text-[10px] tracking-widest flex items-center justify-center w-full h-full">NO POSTER</span>
                            )}
                            <div className="absolute top-2 left-2 z-10">
                                <span className={`px-2.5 py-0.5 text-[9px] font-black tracking-widest uppercase rounded-full border shadow-sm backdrop-blur-md ${room.status === 'OPEN' ? 'bg-[#00E676] text-black border-[#00E676]' : 'bg-zinc-800/90 text-zinc-400 border-zinc-700'}`}>
                                    {room.status === 'OPEN' ? t('statusOpen') : t('statusClosed')}
                                </span>
                            </div>
                        </div>
                        <div className="px-2 pb-1 flex flex-col flex-1">
                            <h3 className="text-[14px] font-bold text-zinc-100 line-clamp-2 leading-tight mb-2 group-hover:text-white transition-colors">{room.title}</h3>
                            <div className="mt-auto pt-3 flex items-center justify-between border-t border-zinc-800/50">
                                <p className="text-[11px] text-zinc-500 font-medium line-clamp-1 flex items-center gap-1.5">
                                    <span className="opacity-70">💬</span>
                                    <span className="truncate">{room.lastMessage || t('noMessage')}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <section className="relative z-10 w-full max-w-[1400px] mx-auto">
            <Tabs defaultValue="all" className="w-full flex flex-col">
                <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-6 bg-zinc-900/40 p-2 md:p-3 rounded-[2rem] border border-zinc-800/60 shadow-sm backdrop-blur-md">
                    <TabsList className="bg-zinc-950/60 p-1.5 h-auto gap-2 rounded-full w-full md:w-auto border border-zinc-800/80 shadow-inner">
                        <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm px-6 py-2.5 font-bold text-xs text-zinc-500 transition-all uppercase tracking-widest flex-1 md:flex-none">
                            {t('tabAll')}
                        </TabsTrigger>
                        <TabsTrigger value="my" className="rounded-full data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=active]:shadow-sm px-6 py-2.5 font-bold text-xs text-zinc-500 transition-all uppercase tracking-widest flex-1 md:flex-none">
                            {t('tabMy')}
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-3 w-full md:w-auto px-2 md:px-0">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full md:w-[130px] bg-zinc-950/60 border-zinc-800/80 rounded-full h-11 text-xs font-bold uppercase tracking-widest text-zinc-400 focus:ring-0 shadow-inner hover:bg-zinc-900 transition-colors">
                                <SelectValue placeholder="STATUS" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 rounded-2xl text-zinc-300 shadow-xl">
                                <SelectItem value="ALL" className="text-xs font-bold">{t('statusAll')}</SelectItem>
                                <SelectItem value="OPEN" className="text-[#00E676] font-bold text-xs">{t('statusOpen')}</SelectItem>
                                <SelectItem value="CLOSED" className="font-bold text-xs text-zinc-500">{t('statusClosed')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full md:w-[130px] bg-zinc-950/60 border-zinc-800/80 rounded-full h-11 text-xs font-bold uppercase tracking-widest text-zinc-400 focus:ring-0 shadow-inner hover:bg-zinc-900 transition-colors">
                                <SelectValue placeholder="SORT" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 rounded-2xl text-zinc-300 shadow-xl">
                                <SelectItem value="LATEST" className="text-xs font-bold">{t('sortLatest')}</SelectItem>
                                <SelectItem value="OLDEST" className="text-xs font-bold">{t('sortOldest')}</SelectItem>
                                <SelectItem value="ACTIVE" className="text-blue-400 font-bold text-xs">{t('sortActive')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <TabsContent value="all" className="mt-0 outline-none w-full">
                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 mt-6 w-full">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="flex flex-col bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
                                    <Skeleton className="aspect-[2/3] w-full rounded-xl bg-zinc-800 mb-3" />
                                    <Skeleton className="h-4 w-3/4 bg-zinc-800 rounded-md ml-2" />
                                    <Skeleton className="h-3 w-1/2 bg-zinc-800/50 rounded-md mt-2 ml-2 mb-1" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        renderRoomCards(rooms, t('emptyAll'), "all")
                    )}
                </TabsContent>

                <TabsContent value="my" className="mt-0 outline-none w-full">
                    {!session ? (
                        <div className="py-24 text-center flex flex-col items-center justify-center bg-zinc-900/50 rounded-[2rem] border border-zinc-800 shadow-sm mt-4 w-full">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-5 text-4xl border border-zinc-800">🔒</div>
                            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{t('loginRequired')}</h3>
                            <p className="text-zinc-400 font-medium mb-8 text-base">{t('loginDesc')}</p>
                            <Button onClick={onRequireLogin} className="bg-white hover:bg-zinc-200 text-black font-semibold rounded-full px-8 py-6 shadow-md text-sm">
                                {t('loginBtn')}
                            </Button>
                        </div>
                    ) : isMyRoomsLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 mt-6 w-full">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex flex-col bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
                                    <Skeleton className="aspect-[2/3] w-full rounded-xl bg-zinc-800 mb-3" />
                                    <Skeleton className="h-4 w-3/4 bg-zinc-800 rounded-md ml-2 mb-2" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        renderRoomCards(myRooms, t('emptyMy'), "my")
                    )}
                </TabsContent>
            </Tabs>
        </section>
    );
}