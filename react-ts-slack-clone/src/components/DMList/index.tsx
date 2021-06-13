import React, { useCallback, useEffect, useState } from 'react';
import { CollapseButton } from '@components/DMList/styles';
import useSWR from 'swr';
import { IUser, IUserWithOnline } from '@src/types/db';
import fetcher from '@src/utils/fetcher';
import { useParams } from 'react-router';
import { NavLink } from 'react-router-dom';
import useSocket from '@hooks/useSocket';

function DMList() {
    const { workspace } = useParams<{ workspace: string }>();

    const { data: userData } = useSWR<IUser>('/api/users', fetcher, {
        dedupingInterval: 2000, // 2초
    });

    const { data: memberData } = useSWR<IUserWithOnline[]>(
        userData ? `/api/workspaces/${workspace}/members` : null,
        fetcher,
    );

    const [channelCollapse, setChannelCollapse] = useState(false);
    const [onlineList, setOnlineList] = useState<number[]>([]);
    const [socket] = useSocket(workspace);

    useEffect(() => {
        if (userData && memberData && socket) {
            socket.on('onlineList', (data: number[]) => {
                console.log(`data:${data}`);
                setOnlineList(data);
            });
        }

        return () => {
            socket?.off('onlineList');
        }
    }, [userData, memberData, socket]);

    const toggleChannelCollapse = useCallback(() => {
        setChannelCollapse((prev) => !prev);
    }, []);

    return (
        <>
            <h2>
                <CollapseButton collapse={channelCollapse} onClick={toggleChannelCollapse}>
                    <i
                        className="c-icon p-channel_sidebar__section_heading_expand p-channel_sidebar__section_heading_expand--show_more_feature c-icon--caret-right c-icon--inherit c-icon--inline"
                        data-qa="channel-section-collapse"
                        aria-hidden="true"
                    />
                </CollapseButton>
                <span style={{ cursor: 'pointer' }} onClick={toggleChannelCollapse}>Direct Messages</span>
            </h2>
            <div>
                {!channelCollapse &&
                    memberData?.map((member) => {
                        const isOnline = onlineList.includes(member.id);
                        return (
                            <NavLink key={member.id} activeClassName="selected" to={`/workspace/${workspace}/dm/${member.id}`}>
                                <i
                                    className={`c-icon p-channel_sidebar__presence_icon p-channel_sidebar__presence_icon--dim_enabled c-presence ${isOnline ? 'c-presence--active c-icon--presence-online' : 'c-icon--presence-offline'
                                        }`}
                                    aria-hidden="true"
                                    data-qa="presence_indicator"
                                    data-qa-presence-self="false"
                                    data-qa-presence-active="false"
                                    data-qa-presence-dnd="false"
                                />
                                <span>{member.nickname}</span>
                                {member.id === userData?.id && <span> (나)</span>}
                            </NavLink>
                        );
                    })}
            </div>
        </>
    );
}

export default DMList;