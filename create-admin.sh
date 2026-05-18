#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: ./create-admin.sh <email> <password>"
    echo "Example: ./create-admin.sh admin@bmanbd.com mysecurepassword"
    exit 1
fi

export ADMIN_EMAIL=$1
export ADMIN_PASS=$2

echo "Setting up admin account for: $ADMIN_EMAIL"

docker compose -f docker-compose.prod.yml exec -T -e ADMIN_EMAIL -e ADMIN_PASS server node <<'EOF'
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./src/models/User');
  
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASS;

  let user = await User.findOne({ email });
  
  if (!user) {
    user = new User({ 
      email, 
      name: 'Admin', 
      role: 'admin', 
      authProvider: 'local', 
      isActive: true 
    });
  }
  
  user.password = password;
  user.role = 'admin'; // ensure they are an admin if the account existed
  await user.save();
  
  console.log('✅ Admin account ready: ' + user.email);
  process.exit(0);
}).catch(e => { 
  console.error("❌ Error setting up admin:", e.message); 
  process.exit(1); 
});
EOF
