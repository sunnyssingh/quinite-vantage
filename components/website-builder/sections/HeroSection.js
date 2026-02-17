export default function HeroSection({ content }) {
    return (
        <div
            className="w-full py-20 px-8 text-center"
            style={{
                backgroundColor: content.backgroundColor || '#f8fafc',
                color: content.textColor || '#0f172a'
            }}
        >
            <h1 className="text-4xl font-bold mb-4">{content.title || 'Welcome to Our Website'}</h1>
            <p className="text-xl opacity-80 max-w-2xl mx-auto">{content.subtitle || 'We build dreams into reality.'}</p>
            {content.showButton && (
                <button className="mt-8 px-6 py-3 bg-primary text-white rounded-lg font-medium inline-block">
                    {content.buttonText || 'Contact Us'}
                </button>
            )}
        </div>
    )
}
