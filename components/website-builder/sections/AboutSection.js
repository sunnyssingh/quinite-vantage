export default function AboutSection({ content }) {
    return (
        <div className="w-full py-24 px-8 bg-white overflow-hidden">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div className="space-y-6 order-2 md:order-1 animate-in slide-in-from-left-8 duration-700 delay-100">
                    <div className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold tracking-wide uppercase">
                        About Us
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                        {content.heading || 'About Our Company'}
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed font-light">
                        {content.text || 'We are a leading real estate developer committed to excellence and sustainability. With over 20 years of experience, we create spaces that inspire.'}
                    </p>

                    {/* Visual flourish */}
                    <div className="h-1 w-20 bg-primary rounded-full mt-8" />
                </div>

                <div className="relative order-1 md:order-2 h-[400px] w-full animate-in slide-in-from-right-8 duration-700">
                    {content.image ? (
                        <div className="relative w-full h-full">
                            <div className="absolute inset-0 bg-primary/5 rounded-2xl transform rotate-3 translate-x-4 translate-y-4" />
                            <img
                                src={content.image}
                                alt="About Us"
                                className="relative w-full h-full object-cover rounded-2xl shadow-2xl"
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-100 opacity-50" />
                            {/* Placeholder Pattern */}
                            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

                            <div className="text-center z-10 p-6">
                                <div className="w-16 h-16 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-sm">
                                    <span className="text-2xl">🏢</span>
                                </div>
                                <p className="text-slate-400 font-medium">Add an image to see it here</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
