import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  selected?: string;
  metadata?: {
    model?: string;
    sessionId?: string;
    usage?: {
      completion_tokens?: number;
      prompt_tokens?: number;
      total_tokens?: number;
    };
    [key: string]: any;
  };
}

export interface ChatSession {
  id: string;
  title: string; // 对话标题
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  apiSessionId: string | null; // API返回的session_id
}

interface ChatHistoryState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  activeChatSessionId: string | null; // 当前激活的对话会话ID
  
  // 会话管理
  createSession: (title?: string) => string; // 返回新创建的会话ID
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newTitle: string) => void;
  setActiveSession: (sessionId: string) => void;
  
  // 消息管理
  addMessage: (message: ChatMessage) => void;
  clearSessionMessages: (sessionId?: string) => void; // 清空指定会话的消息
  
  // API会话ID管理
  setSessionId: (apiSessionId: string) => void;
  resetSession: () => void;

  // 兼容旧版本的方法
  messages: ChatMessage[]; // 当前活跃会话的消息
  clearHistory: () => void; // 清空当前活跃会话
}

// 创建默认对话标题
const createDefaultTitle = (sessionId: string): string => {
  return 'AI助手';
};

export const useChatHistoryStore = create<ChatHistoryState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null, // API会话ID
      activeChatSessionId: null,
      messages: [], // 当前活跃会话的消息（兼容旧版本）
      
      // 创建新对话会话
      createSession: (title) => {
        const sessionId = Date.now().toString();
        const newSession: ChatSession = {
          id: sessionId,
          title: title || createDefaultTitle(sessionId),
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          apiSessionId: null
        };
        
        set(state => ({
          sessions: [...state.sessions, newSession],
          activeChatSessionId: sessionId,
          currentSessionId: null, // 重置API会话ID
          messages: [] // 清空当前消息（兼容旧版本）
        }));
        
        return sessionId;
      },
      
      // 删除对话会话
      deleteSession: (sessionId) => {
        try {
          if (!sessionId) {
            console.warn('尝试删除会话但未提供会话ID');
            return;
          }
          
          const { sessions, activeChatSessionId } = get();
          
          if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
            console.warn('会话列表为空或无效');
            return;
          }
          
          const filteredSessions = sessions.filter(s => s.id !== sessionId);
          
          // 如果删除的是当前活跃会话，则自动切换到最新的一个会话
          let newActiveId = activeChatSessionId;
          if (sessionId === activeChatSessionId) {
            newActiveId = filteredSessions.length > 0 ? filteredSessions[filteredSessions.length - 1].id : null;
          }
          
          // 安全地获取新激活会话的API会话ID和消息
          let newApiSessionId = null;
          let newMessages: ChatMessage[] = [];
          
          if (newActiveId) {
            const newActiveSession = sessions.find(s => s.id === newActiveId);
            if (newActiveSession) {
              newApiSessionId = newActiveSession.apiSessionId;
              newMessages = newActiveSession.messages || [];
            }
          }
          
          set({
            sessions: filteredSessions,
            activeChatSessionId: newActiveId,
            currentSessionId: newApiSessionId,
            messages: newMessages
          });
        } catch (error) {
          console.error('删除会话时发生错误:', error);
          // 尝试恢复到安全状态
          const { sessions } = get();
          if (sessions && Array.isArray(sessions) && sessions.length > 0) {
            const lastSession = sessions[sessions.length - 1];
            set({
              activeChatSessionId: lastSession.id,
              currentSessionId: lastSession.apiSessionId,
              messages: lastSession.messages || []
            });
          }
        }
      },
      
      // 重命名对话会话
      renameSession: (sessionId, newTitle) => {
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === sessionId 
              ? { ...s, title: newTitle, updatedAt: new Date() } 
              : s
          )
        }));
      },
      
      // 设置当前活跃会话
      setActiveSession: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        set({
          activeChatSessionId: sessionId,
          currentSessionId: session.apiSessionId,
          messages: session.messages // 更新当前消息（兼容旧版本）
        });
      },
      
      // 添加消息到当前活跃会话
      addMessage: (message) => {
        const { activeChatSessionId, sessions } = get();
        
        // 如果没有活跃会话，先创建一个
        if (!activeChatSessionId) {
          const newSessionId = get().createSession();
          
          set(state => ({
            sessions: state.sessions.map(s => 
              s.id === newSessionId 
                ? { 
                    ...s, 
                    messages: [...s.messages, message],
                    updatedAt: new Date()
                  } 
                : s
            ),
            messages: [message] // 更新当前消息（兼容旧版本）
          }));
          return;
        }
        
        // 添加消息到活跃会话
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === activeChatSessionId 
              ? { 
                  ...s, 
                  messages: [...s.messages, message],
                  updatedAt: new Date()
                } 
              : s
          ),
          messages: [...state.messages, message] // 更新当前消息（兼容旧版本）
        }));
      },
      
      // 清空指定会话的消息
      clearSessionMessages: (sessionId) => {
        const targetSessionId = sessionId || get().activeChatSessionId;
        if (!targetSessionId) return;
        
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === targetSessionId 
              ? { 
                  ...s, 
                  messages: [],
                  apiSessionId: null,
                  updatedAt: new Date()
                } 
              : s
          ),
          currentSessionId: targetSessionId === get().activeChatSessionId ? null : get().currentSessionId,
          messages: targetSessionId === get().activeChatSessionId ? [] : get().messages // 更新当前消息（兼容旧版本）
        }));
      },
      
      // 设置API会话ID
      setSessionId: (apiSessionId) => {
        const { activeChatSessionId } = get();
        if (!activeChatSessionId) return;
        
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === activeChatSessionId 
              ? { ...s, apiSessionId } 
              : s
          ),
          currentSessionId: apiSessionId
        }));
      },
      
      // 重置API会话
      resetSession: () => {
        const { activeChatSessionId } = get();
        if (!activeChatSessionId) return;
        
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === activeChatSessionId 
              ? { ...s, apiSessionId: null } 
              : s
          ),
          currentSessionId: null
        }));
      },
      
      // 兼容旧版本的方法
      clearHistory: () => {
        const { activeChatSessionId } = get();
        if (!activeChatSessionId) return;
        
        get().clearSessionMessages(activeChatSessionId);
      }
    }),
    {
      name: 'chat-history-storage',
      partialize: (state) => ({
        sessions: state.sessions.map(session => ({
          ...session,
          messages: session.messages.slice(-100) // 每个会话只存储最近100条消息，避免存储过大
        })).slice(-50), // 只存储最近50个会话
        activeChatSessionId: state.activeChatSessionId
      }),
    }
  )
);
