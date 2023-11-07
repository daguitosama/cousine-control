export function AppHeader({ ...props }) {
    return (
        <div className='w-full py-[20px] flex items-center justify-between'>{props.children}</div>
    );
}
