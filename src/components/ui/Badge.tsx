import { getStatusColor } from '@/lib/utils';

interface BadgeProps {
    status: string;
    className?: string;
}

export default function Badge({ status, className = '' }: BadgeProps) {
    return (
        <span className={`badge ${getStatusColor(status)} ${className}`}>
            {status}
        </span>
    );
}
