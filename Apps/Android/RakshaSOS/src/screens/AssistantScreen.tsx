import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import {
  ArrowLeft,
  Send,
  Bot,
  Mic,
  ShieldCheck,
  AlertCircle
} from 'lucide-react-native';
import { getRakshaSafetyReply, GroqChatMessage } from '../services/groqAssistant';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export default function AssistantScreen({ navigation }: any) {        
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I am your Raksha AI Safety Assistant. How can I help secure your journey or answer your safety queries today?',
      time: '12:00 PM',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const suggestions = [
    "Safety tips for walking alone at night",
    "What should I do if someone is tailgating me?",
    "Check local police station contact info",
  ];

  const buildGroqMessages = (nextUserText: string): GroqChatMessage[] => [
    ...messages
      .filter((message) => message.id !== '1')
      .slice(-8)
      .map((message): GroqChatMessage => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
      })),
    {
      role: 'user',
      content: nextUserText,
    },
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    if (isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const reply = await getRakshaSafetyReply(buildGroqMessages(textToSend));
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text:
          error instanceof Error
            ? `I could not reach Raksha Safety AI: ${error.message}`
            : 'I could not reach Raksha Safety AI right now. If this is urgent, trigger SOS or call 112.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#ac2b2e" />
          </TouchableOpacity>
        )}
        <View style={styles.headerTitleContainer}>
          <Bot size={22} color="#ac2b2e" />
          <View>
            <Text style={styles.headerTitle}>Raksha Safety AI</Text>  
            <Text style={styles.headerStatus}>Online / Secured</Text> 
          </View>
        </View>
        <ShieldCheck size={20} color="#346645" />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}      
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                msg.sender === 'user' ? styles.messageRowUser : styles.messageRowBot,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  msg.sender === 'user' ? styles.bubbleUser : styles.bubbleBot,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.sender === 'user' ? styles.messageTextUser : styles.messageTextBot,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    msg.sender === 'user' ? styles.messageTimeUser : styles.messageTimeBot,
                  ]}
                >
                  {msg.time}
                </Text>
              </View>
            </View>
          ))}

          {isTyping && (
            <View style={[styles.messageRow, styles.messageRowBot]}>  
              <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#ac2b2e" />    
                <Text style={styles.typingText}>Safety assistant is typing...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
              {suggestions.map((sug, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => handleSend(sug)}
                >
                  <Text style={styles.suggestionText}>{sug}</Text>    
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type your safety query here..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend(inputText)}
          />

          <TouchableOpacity
            style={[styles.sendButton, isTyping && styles.sendButtonDisabled]}
            onPress={() => handleSend(inputText)}
            disabled={isTyping}
          >
            <Send size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf9f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0bfbc',
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1c1b',
  },
  headerStatus: {
    fontSize: 10,
    color: '#346645',
    fontWeight: '600',
  },
  keyboardContainer: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    width: '100%',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 14,
  },
  bubbleUser: {
    backgroundColor: '#ac2b2e',
    borderTopRightRadius: 2,
  },
  bubbleBot: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e0bfbc',
    borderTopLeftRadius: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextUser: {
    color: '#FFF',
  },
  messageTextBot: {
    color: '#1a1c1b',
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeUser: {
    color: '#ffdad6',
  },
  messageTimeBot: {
    color: '#777',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#ac2b2e',
    fontWeight: '500',
  },
  suggestionsContainer: {
    height: 48,
    backgroundColor: '#faf9f7',
    borderTopWidth: 1,
    borderTopColor: '#e0bfbc',
  },
  suggestionsScroll: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#e0bfbc',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  suggestionText: {
    fontSize: 11,
    color: '#ac2b2e',
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#e0bfbc',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#faf9f7',
    borderWidth: 1,
    borderColor: '#e0bfbc',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    fontSize: 14,
    color: '#1a1c1b',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ac2b2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#c88d8f',
  },
});
