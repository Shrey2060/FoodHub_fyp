export const getStatusColor = (status) => {
    if (!status) return 'status-pending';
    
    switch (status.toLowerCase()) {
        case 'pending':
            return 'status-pending';
        case 'processing':
            return 'status-processing';
        case 'completed':
            return 'status-completed';
        case 'cancelled':
            return 'status-cancelled';
        default:
            return 'status-pending';
    }
};
