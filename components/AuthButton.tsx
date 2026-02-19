'use client';

import { LogOut } from 'lucide-react';
import { logout } from '@/app/login/actions';

export default function AuthButton() {
    return (
        <button
            onClick={() => logout()}
            className="btn bg-neutral-100 text-sm hover:bg-neutral-200 flex items-center gap-2"
            title="Sign Out"
        >
            <LogOut size={16} />
        </button>
    );
}
