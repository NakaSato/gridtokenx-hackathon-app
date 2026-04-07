import React from 'react'

export default function PrivacyPolicyPage() {
    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl text-foreground overflow-y-auto h-full">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <p className="mb-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
                <p className="mb-4 leading-relaxed">
                    Welcome to GridTokenX. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. The Data We Collect</h2>
                <p className="mb-4 leading-relaxed">
                    We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                    <li><strong>Identity Data:</strong> includes username or similar identifier.</li>
                    <li><strong>Contact Data:</strong> includes email address.</li>
                    <li><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform and other technology on the devices you use to access this website.</li>
                    <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
                    <li><strong>Wallet Data:</strong> includes your public wallet address and transaction history on the blockchain.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3. How We Use Your Data</h2>
                <p className="mb-4 leading-relaxed">
                    We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                </p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
                    <li>To provide and maintain our Service.</li>
                    <li>To notify you about changes to our Service.</li>
                    <li>To allow you to participate in interactive features of our Service when you choose to do so.</li>
                    <li>To provide customer support.</li>
                    <li>To gather analysis or valuable information so that we can improve our Service.</li>
                    <li>To monitor the usage of our Service.</li>
                    <li>To detect, prevent and address technical issues.</li>
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Blockchain Data</h2>
                <p className="mb-4 leading-relaxed">
                    Please note that due to the inherent nature of the blockchain, any transactions you make are public and stored permanently on the blockchain. This data includes your wallet address and transaction details. We do not control this public data and it is not covered by this Privacy Policy.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Contact Us</h2>
                <p className="mb-4 leading-relaxed">
                    If you have any questions about this Privacy Policy, please contact us at support@gridtokenx.com.
                </p>
            </section>
        </div>
    )
}
