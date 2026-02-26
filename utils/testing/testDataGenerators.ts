import { 
  Transaction, 
  NetworkRequest, 
  ContractExecution, 
  LogEntry, 
  Post, 
  Message, 
  Conversation, 
  Platform 
} from '../../types';

// Utility functions for generating random data
const randomChoice = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number): number => Math.random() * (max - min) + min;
const randomBoolean = (): boolean => Math.random() > 0.5;
const randomDate = (start: Date = new Date(2023, 0, 1), end: Date = new Date()): Date => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Address and hash generators
export const generateAddress = (): string => {
  return `0x${Array.from({ length: 40 }, () => randomChoice('0123456789abcdef')).join('')}`;
};

export const generateHash = (length: number = 64): string => {
  return `0x${Array.from({ length }, () => randomChoice('0123456789abcdef')).join('')}`;
};

// Transaction generators
export const generateMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => {
  const types: Transaction['type'][] = ['post', 'comment', 'like', 'share', 'follow', 'message', 'campaign', 'payment'];
  const platforms = Object.values(Platform);
  const statuses: Transaction['status'][] = ['pending', 'completed', 'failed'];

  return {
    id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    type: randomChoice(types),
    platform: randomChoice(platforms),
    description: generateTransactionDescription(),
    timestamp: randomDate(),
    status: randomChoice(statuses),
    metadata: {
      userId: `user_${randomInt(1, 1000)}`,
      amount: Math.random() > 0.7 ? randomInt(1, 1000) : undefined,
      ...generateRandomMetadata()
    },
    isNew: randomBoolean(),
    ...overrides
  };
};

export const generateTransactionBatch = (count: number = 10): Transaction[] => {
  return Array.from({ length: count }, () => generateMockTransaction());
};

// Network request generators
export const generateMockNetworkRequest = (overrides: Partial<NetworkRequest> = {}): NetworkRequest => {
  const methods: NetworkRequest['method'][] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const statusCodes = [200, 201, 204, 400, 401, 403, 404, 500, 502, 503];
  const urls = [
    'https://api.socialflow.com/v1/posts',
    'https://api.socialflow.com/v1/users',
    'https://api.socialflow.com/v1/analytics',
    'https://api.socialflow.com/v1/campaigns',
    'https://graph.facebook.com/v18.0/me',
    'https://api.twitter.com/2/tweets',
    'https://api.instagram.com/v1/media'
  ];

  const method = randomChoice(methods);
  const status = randomChoice(statusCodes);
  const url = randomChoice(urls);

  return {
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    method,
    url: `${url}/${randomInt(1, 1000)}`,
    status,
    duration: randomInt(50, 5000),
    timestamp: randomDate(),
    requestHeaders: generateRequestHeaders(method),
    responseHeaders: generateResponseHeaders(),
    requestBody: method !== 'GET' ? generateRequestBody(method) : undefined,
    responseBody: status < 400 ? generateResponseBody() : undefined,
    error: status >= 400 ? generateErrorMessage(status) : undefined,
    ...overrides
  };
};

export const generateNetworkRequestBatch = (count: number = 20): NetworkRequest[] => {
  return Array.from({ length: count }, () => generateMockNetworkRequest());
};

// Contract execution generators
export const generateMockContractExecution = (overrides: Partial<ContractExecution> = {}): ContractExecution => {
  const methods = ['transfer', 'approve', 'mint', 'burn', 'swap', 'stake', 'unstake', 'claim'];
  const statuses: ContractExecution['status'][] = ['success', 'failed', 'pending'];
  
  const method = randomChoice(methods);
  const status = randomChoice(statuses);

  return {
    id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    contractAddress: generateAddress(),
    method,
    parameters: generateContractParameters(method),
    gasUsed: randomInt(21000, 500000),
    gasLimit: randomInt(100000, 1000000),
    status,
    timestamp: randomDate(),
    transactionHash: status !== 'pending' ? generateHash() : undefined,
    blockNumber: status === 'success' ? randomInt(15000000, 16000000) : undefined,
    error: status === 'failed' ? generateContractError() : undefined,
    logs: status === 'success' ? generateContractLogs() : [],
    ...overrides
  };
};

export const generateContractExecutionBatch = (count: number = 15): ContractExecution[] => {
  return Array.from({ length: count }, () => generateMockContractExecution());
};

// Log entry generators
export const generateMockLogEntry = (overrides: Partial<LogEntry> = {}): LogEntry => {
  const levels: LogEntry['level'][] = ['debug', 'info', 'warn', 'error'];
  const sources = ['system', 'network', 'database', 'auth', 'api', 'ui', 'background-task', 'console'];
  
  const level = randomChoice(levels);
  const source = randomChoice(sources);

  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    level,
    message: generateLogMessage(level, source),
    timestamp: randomDate(),
    source,
    metadata: generateLogMetadata(source),
    stackTrace: level === 'error' ? generateStackTrace() : undefined,
    ...overrides
  };
};

export const generateLogEntryBatch = (count: number = 50): LogEntry[] => {
  return Array.from({ length: count }, () => generateMockLogEntry());
};

// Social media data generators
export const generateMockPost = (overrides: Partial<Post> = {}): Post => {
  const platforms = Object.values(Platform);
  const statuses: Post['status'][] = ['scheduled', 'published', 'draft'];
  
  return {
    id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    platform: randomChoice(platforms),
    content: generatePostContent(),
    image: randomBoolean() ? generateImageUrl() : undefined,
    date: randomDate(),
    status: randomChoice(statuses),
    stats: randomBoolean() ? {
      likes: randomInt(0, 10000),
      views: randomInt(0, 100000)
    } : undefined,
    ...overrides
  };
};

export const generateMockMessage = (overrides: Partial<Message> = {}): Message => {
  const senders = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Alex Brown'];
  
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    sender: randomChoice(senders),
    avatar: generateAvatarUrl(),
    text: generateMessageText(),
    timestamp: randomDate().toISOString(),
    isMe: randomBoolean(),
    ...overrides
  };
};

export const generateMockConversation = (overrides: Partial<Conversation> = {}): Conversation => {
  const platforms: Conversation['platform'][] = ['instagram', 'facebook', 'x'];
  const statuses: Conversation['status'][] = ['new', 'pending', 'resolved'];
  const users = ['customer_1', 'user_abc', 'follower_xyz', 'client_123'];
  
  const messageCount = randomInt(1, 10);
  const messages = Array.from({ length: messageCount }, () => generateMockMessage());

  return {
    id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    platform: randomChoice(platforms),
    user: randomChoice(users),
    avatar: generateAvatarUrl(),
    lastMessage: messages[messages.length - 1]?.text || 'Hello!',
    unread: randomBoolean(),
    status: randomChoice(statuses),
    messages,
    ...overrides
  };
};

// Helper functions for generating specific content
const generateTransactionDescription = (): string => {
  const actions = [
    'New post published on Instagram',
    'Comment replied on Facebook',
    'Story shared on TikTok',
    'Campaign launched on LinkedIn',
    'Payment processed for premium features',
    'User followed on Twitter',
    'Message sent to customer',
    'Analytics data updated'
  ];
  return randomChoice(actions);
};

const generateRandomMetadata = (): Record<string, any> => {
  const metadata: Record<string, any> = {};
  
  if (randomBoolean()) metadata.campaignId = `campaign_${randomInt(1, 100)}`;
  if (randomBoolean()) metadata.postId = `post_${randomInt(1, 1000)}`;
  if (randomBoolean()) metadata.engagement = randomFloat(0, 100);
  if (randomBoolean()) metadata.reach = randomInt(100, 10000);
  
  return metadata;
};

const generateRequestHeaders = (method: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': method !== 'GET' ? 'application/json' : 'text/html',
    'User-Agent': 'SocialFlow/1.0.0',
    'Accept': 'application/json, text/plain, */*'
  };
  
  if (method !== 'GET') {
    headers['Content-Length'] = randomInt(100, 5000).toString();
  }
  
  if (randomBoolean()) {
    headers['Authorization'] = `Bearer ${generateHash(32)}`;
  }
  
  return headers;
};

const generateResponseHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'X-RateLimit-Remaining': randomInt(0, 1000).toString(),
    'X-Response-Time': `${randomInt(10, 500)}ms`
  };
};

const generateRequestBody = (method: string): any => {
  if (method === 'POST') {
    return {
      title: 'New social media post',
      content: 'This is a test post content',
      platform: randomChoice(Object.values(Platform)),
      scheduled_at: randomDate().toISOString()
    };
  }
  
  if (method === 'PUT' || method === 'PATCH') {
    return {
      id: randomInt(1, 1000),
      status: randomChoice(['active', 'inactive', 'pending']),
      updated_at: new Date().toISOString()
    };
  }
  
  return null;
};

const generateResponseBody = (): any => {
  return {
    success: true,
    data: {
      id: randomInt(1, 10000),
      created_at: randomDate().toISOString(),
      status: 'success'
    },
    meta: {
      total: randomInt(1, 100),
      page: 1,
      per_page: 20
    }
  };
};

const generateErrorMessage = (status: number): string => {
  const errorMessages: Record<number, string[]> = {
    400: ['Bad Request: Invalid parameters', 'Validation failed'],
    401: ['Unauthorized: Invalid token', 'Authentication required'],
    403: ['Forbidden: Insufficient permissions', 'Access denied'],
    404: ['Not Found: Resource does not exist', 'Endpoint not found'],
    500: ['Internal Server Error', 'Database connection failed'],
    502: ['Bad Gateway: Upstream server error', 'Service unavailable'],
    503: ['Service Unavailable: Maintenance mode', 'Rate limit exceeded']
  };
  
  const messages = errorMessages[status] || ['Unknown error'];
  return randomChoice(messages);
};

const generateContractParameters = (method: string): any[] => {
  switch (method) {
    case 'transfer':
      return [generateAddress(), randomInt(1, 1000000).toString()];
    case 'approve':
      return [generateAddress(), randomInt(1, 1000000).toString()];
    case 'mint':
      return [generateAddress(), randomInt(1, 100000).toString()];
    case 'burn':
      return [randomInt(1, 100000).toString()];
    case 'swap':
      return [
        randomInt(1, 1000).toString(),
        randomInt(1, 1000).toString(),
        generateAddress()
      ];
    case 'stake':
      return [randomInt(1, 100000).toString()];
    case 'unstake':
      return [randomInt(1, 100000).toString()];
    case 'claim':
      return [];
    default:
      return [];
  }
};

const generateContractError = (): string => {
  const errors = [
    'Insufficient balance',
    'Gas limit exceeded',
    'Revert: Transfer amount exceeds allowance',
    'Revert: ERC20: transfer to the zero address',
    'Revert: Ownable: caller is not the owner',
    'Revert: Pausable: paused',
    'Execution reverted: Custom error'
  ];
  return randomChoice(errors);
};

const generateContractLogs = (): any[] => {
  const logCount = randomInt(1, 5);
  return Array.from({ length: logCount }, (_, index) => ({
    id: `log_${Date.now()}_${index}`,
    address: generateAddress(),
    topics: [generateHash(), generateHash()],
    data: generateHash(128),
    blockNumber: randomInt(15000000, 16000000),
    transactionHash: generateHash(),
    logIndex: index
  }));
};

const generateLogMessage = (level: LogEntry['level'], source: string): string => {
  const messages: Record<LogEntry['level'], string[]> = {
    debug: [
      `[${source}] Processing background task`,
      `[${source}] Cache hit for user data`,
      `[${source}] Validating user input`,
      `[${source}] Initializing component`,
      `[${source}] Cleaning up resources`
    ],
    info: [
      `[${source}] User logged in successfully`,
      `[${source}] Data synchronized`,
      `[${source}] Background job completed`,
      `[${source}] Configuration updated`,
      `[${source}] Feature flag toggled`
    ],
    warn: [
      `[${source}] API rate limit approaching`,
      `[${source}] Deprecated method used`,
      `[${source}] Large payload detected`,
      `[${source}] Slow query detected`,
      `[${source}] Memory usage high`
    ],
    error: [
      `[${source}] Failed to connect to database`,
      `[${source}] Authentication failed`,
      `[${source}] Network timeout`,
      `[${source}] Invalid configuration`,
      `[${source}] Unhandled exception occurred`
    ]
  };
  
  return randomChoice(messages[level]);
};

const generateLogMetadata = (source: string): Record<string, any> => {
  const metadata: Record<string, any> = {};
  
  if (source === 'network') {
    metadata.url = `https://api.example.com/v1/${Math.random().toString(36).substring(2, 10)}`;
    metadata.statusCode = randomChoice([200, 404, 500]);
    metadata.duration = `${randomInt(10, 2000)}ms`;
  }
  
  if (source === 'database') {
    metadata.query = `SELECT * FROM ${randomChoice(['users', 'posts', 'transactions'])}`;
    metadata.duration = `${randomInt(5, 1000)}ms`;
    metadata.rows = randomInt(0, 1000);
  }
  
  if (source === 'auth') {
    metadata.userId = `user_${randomInt(1, 1000)}`;
    metadata.sessionId = generateHash(16);
  }
  
  return metadata;
};

const generateStackTrace = (): string => {
  const functions = ['processRequest', 'validateUser', 'executeQuery', 'handleError', 'parseData'];
  const files = ['auth.service.ts', 'database.service.ts', 'api.controller.ts', 'utils.ts', 'middleware.ts'];
  
  return Array.from({ length: randomInt(3, 8) }, (_, index) => {
    const func = randomChoice(functions);
    const file = randomChoice(files);
    const line = randomInt(10, 500);
    const col = randomInt(5, 50);
    return `    at ${func} (${file}:${line}:${col})`;
  }).join('\n');
};

const generatePostContent = (): string => {
  const contents = [
    'Excited to share our latest product update! 🚀',
    'Behind the scenes of our amazing team working hard 💪',
    'Customer success story that made our day ❤️',
    'Tips and tricks for social media marketing 📈',
    'Throwback to our company retreat last month 🏖️',
    'New feature announcement coming soon! Stay tuned 👀',
    'Thank you to all our amazing customers for your support 🙏'
  ];
  return randomChoice(contents);
};

const generateMessageText = (): string => {
  const messages = [
    'Hello! I have a question about your service.',
    'Thank you for the quick response!',
    'Could you help me with my account settings?',
    'I love the new features you added recently.',
    'Is there a way to export my data?',
    'The app is working great, thanks!',
    'I encountered an issue, can you assist?'
  ];
  return randomChoice(messages);
};

const generateImageUrl = (): string => {
  const imageIds = Array.from({ length: 10 }, (_, i) => i + 1);
  return `https://picsum.photos/400/300?random=${randomChoice(imageIds)}`;
};

const generateAvatarUrl = (): string => {
  const avatarIds = Array.from({ length: 20 }, (_, i) => i + 1);
  return `https://i.pravatar.cc/150?img=${randomChoice(avatarIds)}`;
};

// Batch generators for multiple data types
export const generateTestDataSet = () => {
  return {
    transactions: generateTransactionBatch(25),
    networkRequests: generateNetworkRequestBatch(30),
    contractExecutions: generateContractExecutionBatch(20),
    logEntries: generateLogEntryBatch(100),
    posts: Array.from({ length: 15 }, () => generateMockPost()),
    conversations: Array.from({ length: 8 }, () => generateMockConversation())
  };
};

// Scenario-based generators
export const generateErrorScenarioData = () => {
  return {
    failedTransactions: Array.from({ length: 5 }, () => 
      generateMockTransaction({ status: 'failed' })
    ),
    errorRequests: Array.from({ length: 10 }, () => 
      generateMockNetworkRequest({ status: randomChoice([400, 401, 403, 404, 500]) })
    ),
    failedExecutions: Array.from({ length: 3 }, () => 
      generateMockContractExecution({ status: 'failed' })
    ),
    errorLogs: Array.from({ length: 20 }, () => 
      generateMockLogEntry({ level: 'error' })
    )
  };
};

export const generatePerformanceTestData = () => {
  return {
    slowRequests: Array.from({ length: 15 }, () => 
      generateMockNetworkRequest({ duration: randomInt(3000, 10000) })
    ),
    highGasExecutions: Array.from({ length: 10 }, () => 
      generateMockContractExecution({ gasUsed: randomInt(800000, 2000000) })
    ),
    heavyLogs: Array.from({ length: 200 }, () => generateMockLogEntry())
  };
};