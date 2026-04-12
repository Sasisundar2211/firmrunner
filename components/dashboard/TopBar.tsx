interface TopBarProps {
  firmName: string
}

export default function TopBar({ firmName }: TopBarProps) {
  return (
    <header className="h-14 shrink-0 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
      <h1 className="text-sm font-semibold text-gray-900 truncate">{firmName}</h1>
    </header>
  )
}
