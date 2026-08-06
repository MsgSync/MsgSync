#!/bin/bash

# Campaign Management Setup Script
# This script sets up the campaign management feature for MsgSync

echo "🚀 Setting up Campaign Management for MsgSync..."
echo ""

# Check if we're in the platform directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the platform directory"
    exit 1
fi

# Step 1: Generate Prisma Client
echo "📦 Step 1: Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi
echo "✅ Prisma client generated"
echo ""

# Step 2: Run database migrations
echo "🗄️  Step 2: Running database migrations..."
npx prisma migrate dev --name add_campaign_features
if [ $? -ne 0 ]; then
    echo "⚠️  Migration failed. Trying to push schema changes..."
    npx prisma db push
    if [ $? -ne 0 ]; then
        echo "❌ Failed to update database schema"
        exit 1
    fi
fi
echo "✅ Database schema updated"
echo ""

# Step 3: Verify setup
echo "🔍 Step 3: Verifying setup..."

# Check if campaign files exist
if [ ! -f "src/public/campaigns.html" ]; then
    echo "❌ campaigns.html not found"
    exit 1
fi

if [ ! -f "src/public/campaigns.css" ]; then
    echo "❌ campaigns.css not found"
    exit 1
fi

if [ ! -f "src/public/campaigns.js" ]; then
    echo "❌ campaigns.js not found"
    exit 1
fi

echo "✅ All campaign files present"
echo ""

# Step 4: Display next steps
echo "✨ Campaign Management Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Start the platform server:"
echo "      pnpm run dev"
echo ""
echo "   2. Access the Campaign Manager:"
echo "      http://localhost:3001/campaigns"
echo ""
echo "   3. Or access via Dashboard:"
echo "      http://localhost:3001/dashboard"
echo "      Click 'Campaigns' in the sidebar"
echo ""
echo "📖 Documentation:"
echo "   View the complete guide at:"
echo "   docs/campaign-management.md"
echo ""
echo "🎉 Happy Campaigning!"
