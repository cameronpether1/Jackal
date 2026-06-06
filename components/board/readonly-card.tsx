import { getAvatarColor } from '@/lib/avatar-color'
import { cn } from '@/lib/utils'
import type { PostWithRelations } from '@/lib/supabase/types'

interface ReadonlyCardProps {
  post: PostWithRelations
  replies: PostWithRelations[]
}

export function ReadonlyCard({ post, replies }: ReadonlyCardProps) {
  const authorColor = getAvatarColor(post.author?.id ?? '')
  const initials = post.author?.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <div
      id={`post-${post.id}`}
      className={cn(
        'absolute w-72 rounded-3xl overflow-visible shadow-[0_4px_24px_rgba(0,0,0,0.09)] select-none border',
        `post-type-${post.type}`,
      )}
      style={{
        left: post.pos_x,
        top: post.pos_y,
        transform: `rotate(${post.rotation}deg)`,
      }}
    >
      {/* Author badge */}
      <div className="absolute -top-5 -right-5 z-10">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ring-[3px] ring-white overflow-hidden shadow-md"
          style={{ backgroundColor: authorColor }}
        >
          {post.author?.avatar_url
            ? <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
            : initials}
        </div>
      </div>

      <div className="p-5 pt-6">
        {post.type === 'question' && (
          <span className="inline-block text-xs font-semibold text-[#1a6a30] mb-1.5">Question</span>
        )}
        {post.title && (
          <h3 className="font-bold text-sm text-jk-text mb-2 leading-snug">{post.title}</h3>
        )}

        {post.type === 'tasks' ? (
          <ul className="space-y-1.5">
            {(post.task_items ?? [])
              .sort((a, b) => a.position - b.position)
              .map(item => (
                <li key={item.id} className="flex items-center gap-2">
                  <div className={cn(
                    'w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0',
                    item.checked
                      ? 'bg-jk-accent border-jk-accent'
                      : 'border-neutral-300'
                  )}>
                    {item.checked && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={cn('text-sm', item.checked ? 'line-through text-jk-text-faint' : 'text-jk-text')}>
                    {item.label}
                  </span>
                </li>
              ))}
          </ul>
        ) : (
          post.content && (
            <p className="text-sm text-jk-text-muted leading-relaxed whitespace-pre-wrap">{post.content}</p>
          )
        )}

        {post.image_url && (
          <div className="mt-3">
            <img src={post.image_url} alt="" className="w-full rounded-2xl object-cover" draggable={false} />
          </div>
        )}

        {replies.length > 0 && (
          <div className="mt-4 pt-3 border-t border-jk-border space-y-3">
            {[...replies]
              .sort((a, b) => a.created_at.localeCompare(b.created_at))
              .map((reply, i) => {
                const isRight = i % 2 === 1
                const replyColor = getAvatarColor(reply.author?.id ?? '')
                const replyInitials = reply.author?.display_name?.[0]?.toUpperCase() ?? '?'
                return (
                  <div key={reply.id} className={cn('flex items-start gap-2', isRight && 'flex-row-reverse')}>
                    <div
                      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold overflow-hidden"
                      style={{ backgroundColor: replyColor }}
                    >
                      {reply.author?.avatar_url
                        ? <img src={reply.author.avatar_url} alt="" className="w-full h-full object-cover" />
                        : replyInitials}
                    </div>
                    <div className={cn('flex-1 min-w-0', isRight && 'text-right')}>
                      <span className="block text-[10px] font-semibold text-jk-text-muted">{reply.author?.display_name}</span>
                      {reply.title && <p className="text-xs font-bold text-jk-text mt-0.5">{reply.title}</p>}
                      {reply.content && <p className="text-xs text-jk-text-muted leading-relaxed whitespace-pre-wrap">{reply.content}</p>}
                      {reply.image_url && <img src={reply.image_url} alt="" className="mt-1.5 w-full rounded-xl object-cover" />}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
