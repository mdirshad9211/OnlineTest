const paths = {
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
  brackets: <path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-12-2 16" />,
  briefcase: <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 4h12m-12 0v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H4V9Z" />,
  chart: <path d="M4 19V5m0 14h16M8 16v-5m4 5V7m4 9v-8" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  code: <path d="m8 9-3 3 3 3m8-6 3 3-3 3m-3-9-2 12" />,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M8 9h8M8 13h8M8 17h5" /></>,
  folder: <><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="M3 9h18" /></>,
  grid: <path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.3 2.3 0 1 1 3.8 1.7c-1 .8-1.6 1.1-1.6 2.3m0 3h.01" /></>,
  home: <><path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Z" /><path d="M9 21v-6h6v6" /></>,
  message: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-3.5-.8L4 20l1.5-3.6A7.4 7.4 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" /></>,
  pen: <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20ZM14 7l3 3" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.4 1.4-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V20h-2v-.4a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L9 17l.1-.1A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.6-1H7v-2h.8a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L9 9l1.4-1.4.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V6h2v.4a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L20 9l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.8v2h-.8a1.7 1.7 0 0 0-1.8 1Z" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.5" /></>,
  shield: <><path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
  upload: <><path d="M12 16V4m0 0L8 8m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></>,
}

export function Icon({ name, size = 20, strokeWidth = 1.8, className = '' }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}>
      {paths[name]}
    </svg>
  )
}
