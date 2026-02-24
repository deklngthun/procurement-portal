interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: { value: number; positive: boolean };
    color?: string;
}

export default function StatCard({ title, value, subtitle, icon, trend, color = 'indigo' }: StatCardProps) {
    const colorMap: Record<string, string> = {
        indigo: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/20',
        emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
        amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
        violet: 'from-violet-500/20 to-violet-600/5 border-violet-500/20',
        rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/20',
        cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20',
    };

    const iconColorMap: Record<string, string> = {
        indigo: 'text-indigo-400',
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        violet: 'text-violet-400',
        rose: 'text-rose-400',
        cyan: 'text-cyan-400',
    };

    return (
        <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorMap[color]} p-6 transition-all-smooth stat-shimmer`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">{title}</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <p className={`text-xs mt-2 font-medium ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-[var(--bg-card)] ${iconColorMap[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
