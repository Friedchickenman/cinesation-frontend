"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";

// 🌟 아까 만든 4개의 레고 블록 불러오기!
import ChatHeader from "./ChatHeader";
import ChatPinnedNotice from "./ChatPinnedNotice";
import ChatMessageList from "./ChatMessageList";
import ChatInputArea from "./ChatInputArea";

interface ChatSectionProps {
    room: any;
    session: any;
    client: any;
    messages: any[];
    inputMessage: string;
    isLoadingMore: boolean;
    showNewMessageBtn: boolean;
    typingUsers: Set<string>;
    chatContainerRef: React.RefObject<HTMLDivElement | null>;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    onScroll: () => void;
    onTyping: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onSendMessage: () => void;
    onScrollToBottom: () => void;
    replyingTo: any | null;
    onReply: (msg: any) => void;
    onCancelReply: () => void;
    onLike: (msgId: number) => void;
}

export default function ChatSection(props: ChatSectionProps) {
    const locale = useLocale();
    const [localPinnedMessage, setLocalPinnedMessage] = useState<string | null>(null);
    const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (props.room?.pinnedMessage) {
            setLocalPinnedMessage(props.room.pinnedMessage);
        }
    }, [props.room?.pinnedMessage]);

    const handlePinMessage = async (content: string) => {
        const confirmMsg = locale === 'en'
            ? (content ? "Pin this message to the top?" : "Unpin the current message?")
            : (content ? "이 메시지를 공지로 등록하시겠습니까?" : "공지를 내리시겠습니까?");

        if (!confirm(confirmMsg)) return;

        try {
            const res = await fetch(`http://localhost:8080/api/rooms/${props.room.id}/pin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content, username: props.session?.user?.name })
            });

            if (res.ok) {
                setLocalPinnedMessage(content || null);
            } else {
                alert(locale === 'en' ? "Failed to pin message." : "공지 등록에 실패했습니다.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col h-[650px] bg-[#09090B] border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden relative">
            {/* 1. 헤더 블록 */}
            <ChatHeader isConnected={!!props.client?.connected} />

            {/* 2. 공지사항 블록 */}
            {localPinnedMessage && (
                <ChatPinnedNotice
                    message={localPinnedMessage}
                    onUnpin={() => handlePinMessage("")}
                    locale={locale}
                />
            )}

            {/* 3. 메시지 리스트 블록 */}
            <ChatMessageList
                messages={props.messages}
                session={props.session}
                mutedUsers={mutedUsers}
                setMutedUsers={setMutedUsers}
                onLike={props.onLike}
                onReply={props.onReply}
                onPinMessage={handlePinMessage}
                isLoadingMore={props.isLoadingMore}
                typingUsers={props.typingUsers}
                chatContainerRef={props.chatContainerRef}
                messagesEndRef={props.messagesEndRef}
                onScroll={props.onScroll}
            />

            {/* 4. 입력창 블록 */}
            <ChatInputArea
                inputMessage={props.inputMessage}
                session={props.session}
                isConnected={!!props.client?.connected}
                roomStatus={props.room?.status}
                replyingTo={props.replyingTo}
                textareaRef={props.textareaRef}
                showNewMessageBtn={props.showNewMessageBtn}
                onTyping={props.onTyping}
                onKeyDown={props.onKeyDown}
                onSendMessage={props.onSendMessage}
                onCancelReply={props.onCancelReply}
                onScrollToBottom={props.onScrollToBottom}
            />
        </div>
    );
}