export default function AboutSection({ content }) {
    return (
        <div className="w-full py-16 px-8 bg-white">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-4">
                    <h2 className="text-3xl font-bold text-slate-900">{content.heading || 'About Our Company'}</h2>
                    <p className="text-slate-600 leading-relaxed">
                        {content.text || 'We are a leading real estate developer committed to excellence and sustainability. With over 20 years of experience, we create spaces that inspire.'}
                    </p>
                </div>
                {content.image && (
                    <div className="flex-1 h-64 bg-slate-100 rounded-xl w-full" />
                )}
            </div>
        </div>
    )
}
