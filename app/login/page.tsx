import { login } from './actions'

export default async function LoginPage(props: {
    searchParams: Promise<{ message: string }>
}) {
    const searchParams = await props.searchParams
    return (
        <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto h-screen">
            <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
                <h1 className="text-2xl font-bold mb-4 text-center">TaskDaily</h1>
                <p className="text-center text-sm text-neutral-500 mb-6">Private Access</p>

                <label className="text-md" htmlFor="email">
                    Email
                </label>
                <input
                    className="rounded-md px-4 py-2 bg-inherit border mb-6"
                    name="email"
                    placeholder="your-email@example.com"
                    required
                />
                <label className="text-md" htmlFor="password">
                    Password
                </label>
                <input
                    className="rounded-md px-4 py-2 bg-inherit border mb-6"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                />
                <button
                    formAction={login}
                    className="bg-neutral-900 text-white dark:bg-white dark:text-black rounded-md px-4 py-2 mb-2"
                >
                    Enter
                </button>

                {searchParams?.message && (
                    <p className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-center text-sm rounded-md">
                        {searchParams.message}
                    </p>
                )}
            </form>
        </div>
    )
}
