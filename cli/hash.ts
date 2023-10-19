import bcrypt from "bcryptjs";
const [binary, file, password] = process.argv;

async function print_hash() {
    const hash = await bcrypt.hash(password, 10);
    console.log(`\n\r -> hash of ${password}:  \n\r`, hash);
}

print_hash();
