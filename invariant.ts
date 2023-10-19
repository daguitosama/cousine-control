export default function invariant(condition: boolean, error_message: string): asserts condition {
    if (condition) {
        return;
    }

    throw new Error(error_message);
}
