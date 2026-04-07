import React from 'react'

export default function TermsAndConditionsPage() {
    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl text-foreground overflow-y-auto h-full">
            <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
            <p className="mb-4 text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">1. Agreement to Terms</h2>
                <p className="mb-4 leading-relaxed">
                    These Terms and Conditions constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and GridTokenX ("we," "us" or "our"), concerning your access to and use of the GridTokenX website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">2. Intellectual Property Rights</h2>
                <p className="mb-4 leading-relaxed">
                    Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">3. User Representations</h2>
                <p className="mb-4 leading-relaxed">
                    By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms and Conditions; (4) you are not a minor in the jurisdiction in which you reside.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">4. Blockchain Transactions</h2>
                <p className="mb-4 leading-relaxed">
                    Transactions on the GridTokenX platform are conducted on the Solana blockchain. We have no control over the blockchain or your interactions with it. You acknowledge that blockchain transactions are irreversible and we cannot reverse or refund any transactions. You are solely responsible for the security of your private keys and wallet access.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">5. Disclaimer</h2>
                <p className="mb-4 leading-relaxed">
                    The Site is provided on an as-is and as-available basis. You agree that your use of the Site and our services will be at your sole risk. To the fullest extent permitted by law, we disclaim all warranties, express or implied, in connection with the Site and your use thereof, including, without limitation, the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">6. Limitation of Liability</h2>
                <p className="mb-4 leading-relaxed">
                    In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages, including lost profit, lost revenue, loss of data, or other damages arising from your use of the Site, even if we have been advised of the possibility of such damages.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-4">7. Contact Us</h2>
                <p className="mb-4 leading-relaxed">
                    If you have any questions about these Terms and Conditions, please contact us at support@gridtokenx.com.
                </p>
            </section>
        </div>
    )
}
