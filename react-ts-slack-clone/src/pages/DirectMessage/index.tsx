import React, { DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Container, Header } from '@pages/DirectMessage/styles';
import gravatar from 'gravatar';
import useSWR, { useSWRInfinite } from 'swr';
import { useParams } from 'react-router';
import { IDM, IUser } from '@src/types/db';
import fetcher from '@src/utils/fetcher';
import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import axios from 'axios';
import inputUser from '@hooks/inputUser';
import { OnChangeHandlerFunc } from 'react-mentions';
import makeDateSection from '@src/utils/makeDateSection';
import Scrollbars from 'react-custom-scrollbars';
import useSocket from '@hooks/useSocket';
import { DragOver } from '../Channel/styles';
import FileCheckModal from '@components/FileCheckModal';

function DirectMessage() {
    const { workspace, id } = useParams<{ workspace: string; id: string }>();
    const userDataUrl = `/api/workspaces/${workspace}/users/${id}`;
    
    const { data: myData } = useSWR<IUser>('/api/users', fetcher);
    const { data: userData } = useSWR<IUser>(userDataUrl, fetcher);
    const { data: chatData, revalidate: chatRevalidate, mutate: chatMutate, setSize } = useSWRInfinite<IDM[]>(
        (index) => `/api/workspaces/${workspace}/dms/${id}/chats?perPage=20&page=${index+1}`, 
        fetcher);

    const scrollbarRef = useRef<Scrollbars>(null);
    const [chat, onChangeChat, setChat] = inputUser<string, OnChangeHandlerFunc>('');
    const [dragging, setDragging] = useState(false);
    const [fileCheckModal, setFileCheckModal] = useState(false);
    const [dragEvemt, setDragEvent] = useState<DragEvent<HTMLDivElement>>();
    const [ socket ] = useSocket(workspace);
        
    const isEmpty = chatData?.[0]?.length===0;
    const isReachingEnd = isEmpty || (chatData && chatData[chatData.length-1].length<20) || false;

    const onMessage = useCallback((data: IDM) => {
        // id는 상대방 아이디
        if (data.SenderId === Number(id) && (myData && myData.id !== Number(id))) {
            chatMutate((chatData) => {
            chatData?.[0].unshift(data);
            return chatData;
          }, false).then(() => {
            if (scrollbarRef.current) {
              if (
                scrollbarRef.current.getScrollHeight() <
                scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop() + 150
              ) {
                setTimeout(() => {
                  scrollbarRef.current?.scrollToBottom();
                }, 50);
              }
            }
          });
        }
      }, []);

    useEffect(() => {
        socket?.on('dm', onMessage);
        return () => {
            socket?.off('dm', onMessage);
        };
    },[socket, onMessage])

    //로딩시 스크롤바 제일 아래로
    useEffect(() => {
        if(chatData?.length === 1){
            scrollbarRef.current?.scrollToBottom();
        }
    }, [chatData]);

    useEffect(() => {
        localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString());
    },[workspace, id]);

    const onSubmitForm = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (chat) {
            chatMutate((prevChatData) => {
                if(myData && userData && chatData){
                    prevChatData?.[0].unshift({
                        id: (chatData[0][0]?.id || 0) + 1,
                        content: chat,
                        SenderId: myData.id,
                        Sender: myData,
                        ReceiverId: userData?.id,
                        Receiver: userData,
                        createdAt: new Date()
                    });
                    scrollbarRef.current?.scrollToBottom();
                }
                return prevChatData;
            }, false)
            .then(() => {
                localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString());
                setChat('');
                if (scrollbarRef.current) scrollbarRef.current.scrollToBottom();
            })
            
            axios.post(`/api/workspaces/${workspace}/dms/${id}/chats`, {
                content: chat
            })
            .then(() => {
                chatRevalidate();
            })
            .catch((error) => console.log(error));

        }
        setChat('');
    }, [chat, myData, userData, chatData, workspace, id])

    const chatDateSection = makeDateSection(chatData ? [...chatData].flat().reverse() : []);

    const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(true);
    }, [dragging])
    
    const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragEvent(e);
        setFileCheckModal(true);
        setDragging(false);
    }, []);

    const onDragLeave = ((e: DragEvent<HTMLDivElement>) => {
        if(e.currentTarget.id === 'leave') setDragging(false);
    });

    if (!userData || !myData) return null;

    return (
        <>
            <Container 
                onDragOver={onDragOver} 
                onDrop={onDrop}
                
            >
                <Header>
                    <img src={gravatar.url(userData?.email, { s: '24px', d: 'retro' })} alt={userData.nickname} />
                    <span>{userData.nickname}</span>
                </Header>
                <ChatList 
                    chatDateSection={chatDateSection} 
                    ref={scrollbarRef} 
                    setSize={setSize}
                    isReachingEnd={isReachingEnd}
                />
                {
                    dragging &&
                    <DragOver id='leave' onDragLeave = {onDragLeave}>
                        !업로드
                    </DragOver>
                }
                <ChatBox chat={chat} onSubmitForm={onSubmitForm} onChangeChat={onChangeChat} placeholder='' />
            </Container>

            <FileCheckModal 
                show={fileCheckModal}
                setFileCheckModal={setFileCheckModal}
                setDragging={setDragging}
                e = {dragEvemt}
                revalidate = {chatRevalidate}
                messageFrom = {'dms'}
            />
        </>
    )
}

export default DirectMessage;
