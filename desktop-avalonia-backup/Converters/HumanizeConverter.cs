using System;
using System.Globalization;
using System.Text;
using Avalonia.Data.Converters;

namespace Synapse.Desktop.Converters;

/// <summary>
/// Turns enum identifiers into human labels, e.g. GeneralReasoning -> "General reasoning".
/// </summary>
public sealed class HumanizeConverter : IValueConverter
{
    public static readonly HumanizeConverter Instance = new();

    private static readonly (string Source, string Label)[] Known =
    {
        ("Byok", "BYOK"),
        ("Ai", "AI"),
    };

    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var text = value?.ToString();
        if (string.IsNullOrEmpty(text))
            return text;

        foreach (var (source, label) in Known)
        {
            if (string.Equals(text, source, StringComparison.Ordinal))
                return label;
        }

        var builder = new StringBuilder(text.Length + 4);
        for (var i = 0; i < text.Length; i++)
        {
            var c = text[i];
            if (i > 0 && char.IsUpper(c) && !char.IsUpper(text[i - 1]))
                builder.Append(' ');

            builder.Append(i == 0 ? char.ToUpperInvariant(c) : char.ToLowerInvariant(c));
        }

        return builder.ToString();
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
