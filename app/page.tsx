"use client";

import { useEffect, useState } from "react";

export default function Home() {
    const [rooms, setRooms] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        // 스프링 부트 백엔드 API 찌르기!
        fetch("http://localhost:8080/api/rooms")
            .then((res) => {
                if (!res.ok) throw new Error("서버 응답 에러");
                return res.json();
            })
            .then((data) => {
                console.log("✅ 백엔드에서 온 데이터:", data);
                setRooms(data);
            })
            .catch((err) => {
                console.error("❌ 통신 에러:", err);
                setError(err.message);
            });
    }, []);

    return (
        <div className="p-10 font-sans">
            <h1 className="text-3xl font-bold mb-6 text-blue-600">
                🎬 CineSation 프론트엔드 연결 테스트
            </h1>

            {error ? (
                <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                    에러 발생: {error} (스프링 부트 서버가 켜져 있는지 확인해 주세요!)
                </div>
            ) : (
                <div className="bg-gray-100 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        🔥 현재 열려있는 토론방 목록
                    </h2>
                    {rooms.length === 0 ? (
                        <p className="text-gray-500">아직 만들어진 방이 없거나 로딩 중입니다.</p>
                    ) : (
                        <ul className="list-disc pl-6 space-y-2">
                            {rooms.map((room: any) => (
                                <li key={room.id} className="text-lg text-gray-700">
                                    <span className="font-bold">{room.title}</span>
                                    <span className="text-sm text-gray-500 ml-2">(영화 ID: {room.movieId})</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}