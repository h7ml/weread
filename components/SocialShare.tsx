/**
 * 社交分享组件 - 支持主流平台分享
 *
 * @description 提供微信、微博、QQ等主流社交平台的分享功能
 * @author h7ml <h7ml@qq.com>
 * @version 1.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

export interface ShareConfig {
  title: string;
  description: string;
  url: string;
  image?: string;
  hashtags?: string[];
}

export interface SocialShareProps {
  config: ShareConfig;
  platforms?: Array<'wechat' | 'weibo' | 'qq' | 'qzone' | 'twitter' | 'facebook' | 'linkedin' | 'telegram' | 'whatsapp'>;
  className?: string;
  showText?: boolean;
}

const platformConfigs = {
  wechat: {
    name: '微信',
    icon: '📱',
    color: '#07C160',
    shareUrl: (config: ShareConfig) => {
      // 微信分享需要通过JS SDK，这里先提供基础链接
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(config.url)}`;
    }
  },
  weibo: {
    name: '微博',
    icon: '🌐',
    color: '#E6162D',
    shareUrl: (config: ShareConfig) => {
      const text = `${config.title} - ${config.description}`;
      return `https://service.weibo.com/share/share.php?url=${encodeURIComponent(config.url)}&title=${encodeURIComponent(text)}&pic=${encodeURIComponent(config.image || '')}`;
    }
  },
  qq: {
    name: 'QQ',
    icon: '🐧',
    color: '#12B7F5',
    shareUrl: (config: ShareConfig) => {
      return `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(config.url)}&title=${encodeURIComponent(config.title)}&desc=${encodeURIComponent(config.description)}&pics=${encodeURIComponent(config.image || '')}`;
    }
  },
  qzone: {
    name: 'QQ空间',
    icon: '⭐',
    color: '#FECE00',
    shareUrl: (config: ShareConfig) => {
      return `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(config.url)}&title=${encodeURIComponent(config.title)}&desc=${encodeURIComponent(config.description)}&pics=${encodeURIComponent(config.image || '')}`;
    }
  },
  twitter: {
    name: 'Twitter',
    icon: '🐦',
    color: '#1DA1F2',
    shareUrl: (config: ShareConfig) => {
      const text = `${config.title} ${config.hashtags?.map(tag => `#${tag}`).join(' ') || ''}`;
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(config.url)}`;
    }
  },
  facebook: {
    name: 'Facebook',
    icon: '📘',
    color: '#1877F2',
    shareUrl: (config: ShareConfig) => {
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(config.url)}&quote=${encodeURIComponent(config.title)}`;
    }
  },
  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    shareUrl: (config: ShareConfig) => {
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(config.url)}&title=${encodeURIComponent(config.title)}&summary=${encodeURIComponent(config.description)}`;
    }
  },
  telegram: {
    name: 'Telegram',
    icon: '✈️',
    color: '#0088CC',
    shareUrl: (config: ShareConfig) => {
      return `https://t.me/share/url?url=${encodeURIComponent(config.url)}&text=${encodeURIComponent(config.title)}`;
    }
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: '💬',
    color: '#25D366',
    shareUrl: (config: ShareConfig) => {
      const text = `${config.title} - ${config.url}`;
      return `https://wa.me/?text=${encodeURIComponent(text)}`;
    }
  }
};

export default function SocialShare({ 
  config, 
  platforms = ['wechat', 'weibo', 'qq', 'qzone', 'twitter', 'facebook'],
  className = '',
  showText = false 
}: SocialShareProps) {
  const handleShare = (platform: keyof typeof platformConfigs) => {
    const platformConfig = platformConfigs[platform];
    
    if (platform === 'wechat') {
      // 微信分享特殊处理，显示二维码
      showWechatShare(config);
      return;
    }
    
    const shareUrl = platformConfig.shareUrl(config);
    
    // 在新窗口打开分享链接
    const width = 600;
    const height = 400;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      shareUrl, 
      `share-${platform}`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(config.url);
      alert('链接已复制到剪贴板');
    } catch (err) {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = config.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('链接已复制到剪贴板');
    }
  };

  return (
    <div className={`social-share ${className}`}>
      {showText && (
        <span className="share-text">分享到：</span>
      )}
      
      <div className="share-buttons">
        {platforms.map(platform => {
          const platformConfig = platformConfigs[platform];
          return (
            <button
              key={platform}
              className="share-button"
              onClick={() => handleShare(platform)}
              title={`分享到${platformConfig.name}`}
              style={{ 
                backgroundColor: platformConfig.color,
                color: 'white'
              }}
            >
              <span className="share-icon">{platformConfig.icon}</span>
              {showText && (
                <span className="share-name">{platformConfig.name}</span>
              )}
            </button>
          );
        })}
        
        {/* 复制链接按钮 */}
        <button
          className="share-button"
          onClick={handleCopyLink}
          title="复制链接"
          style={{ 
            backgroundColor: '#6B7280',
            color: 'white'
          }}
        >
          <span className="share-icon">🔗</span>
          {showText && (
            <span className="share-name">复制链接</span>
          )}
        </button>
      </div>
      
      <style jsx>{`
        .social-share {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .share-text {
          font-size: 0.875rem;
          color: #6B7280;
          margin-right: 0.5rem;
        }
        
        .share-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .share-button {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          text-decoration: none;
        }
        
        .share-button:hover {
          opacity: 0.8;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .share-icon {
          font-size: 1rem;
          line-height: 1;
        }
        
        .share-name {
          font-size: 0.75rem;
          white-space: nowrap;
        }
        
        @media (max-width: 640px) {
          .share-button .share-name {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

// 微信分享特殊处理函数
function showWechatShare(config: ShareConfig) {
  // 创建模态框显示微信二维码
  const modal = document.createElement('div');
  modal.className = 'wechat-share-modal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="this.parentElement.remove()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>微信扫码分享</h3>
          <button class="modal-close" onclick="this.closest('.wechat-share-modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="qr-code">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(config.url)}" 
                 alt="微信分享二维码" />
          </div>
          <p class="share-tip">打开微信扫一扫，分享给朋友</p>
          <div class="share-info">
            <p class="share-title">${config.title}</p>
            <p class="share-desc">${config.description}</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    .wechat-share-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
    }
    .modal-overlay {
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 320px;
      width: 100%;
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #E5E7EB;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
    }
    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6B7280;
    }
    .modal-body {
      padding: 1.5rem;
      text-align: center;
    }
    .qr-code {
      margin-bottom: 1rem;
    }
    .qr-code img {
      width: 200px;
      height: 200px;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
    }
    .share-tip {
      color: #6B7280;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    .share-info {
      text-align: left;
      padding: 1rem;
      background: #F9FAFB;
      border-radius: 8px;
    }
    .share-title {
      font-weight: 600;
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
    }
    .share-desc {
      color: #6B7280;
      font-size: 0.75rem;
      margin: 0;
      line-height: 1.4;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(modal);
}