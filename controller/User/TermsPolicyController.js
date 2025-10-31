const AppConfig = require('../../model/AppConfig')

exports.getTermsPolicyController = async (req, res, next) => {
    try {
        const appConfig = new AppConfig({
            type: "2",
            terms_condition: `
        <h1>Master Service Agreement</h1>
        <p><strong>Between:</strong> Dream Weavers Edutrack Limited & Paalm Paradise</p>
        <p><strong>Last Updated:</strong> [Insert Date]</p>

        <p>This Master Service Agreement (“Agreement”) is entered into between
        <strong>Dream Weavers Edutrack Limited</strong> (“Service Provider”) and
        <strong>Paalm Paradise</strong> (“User” or “Customer”), governing the User’s
        access to and use of the <strong>Paalm Paradise</strong> software platform (“Product” or “Platform”).</p>

        <p>By accessing or using the Product, the User irrevocably agrees to comply with
        and be bound by this Agreement, the incorporated <a href="#privacy">Privacy Policy</a>,
        and the <a href="#dpa">Data Processing Agreement (DPA)</a>.</p>

        <h2>1. Definitions</h2>
        <ul>
          <li><strong>Service Provider</strong> means Dream Weavers Edutrack Limited, its subsidiaries, and affiliates.</li>
          <li><strong>Product</strong> or <strong>Platform</strong> means the Paalm Paradise software application and related services.</li>
          <li><strong>User</strong> or <strong>Customer</strong> means Paalm Paradise or its representatives registered to use the Product.</li>
          <li><strong>Order Form</strong> means the document specifying subscription terms and purchased services.</li>
        </ul>

        <h2>2. Modification of Terms</h2>
        <p>The Service Provider reserves the right to update, amend, or modify these Terms at any time...</p>

        <p>For any questions, contact: <a href="mailto:info@dreamweaversgroup.co.in">info@dreamweaversgroup.co.in</a></p>
      `,

            privacy_policy: `
        <h1>Privacy Policy</h1>
        <p><strong>Last Updated:</strong> [Insert Date]</p>

        <h2>1. Introduction</h2>
        <p>This Privacy Policy outlines how <strong>Dream Weavers Edutrack Limited</strong> (“we,” “our,” or “Service Provider”)
        collects, uses, and protects the information provided by <strong>Paalm Paradise</strong> (“User” or “you”).</p>

        <h2>2. Consent</h2>
        <p>By using the Platform, you consent to the collection, use, and disclosure of your information as described in this Policy.</p>

        <h2>3. Information We Collect</h2>
        <ul>
          <li><strong>Personal Data:</strong> Information such as name, email, and contact details.</li>
          <li><strong>Technical Information:</strong> IP address, browser type, and usage data.</li>
          <li><strong>Location Information:</strong> Geographical data (if permitted).</li>
        </ul>

        <h2>4. How We Use Information</h2>
        <ul>
          <li>To provide, operate, and maintain the Platform.</li>
          <li>To improve and personalize your experience.</li>
          <li>To comply with legal obligations.</li>
        </ul>

        <p>Contact us for privacy concerns: <a href="mailto:info@dreamweaversgroup.co.in">info@dreamweaversgroup.co.in</a></p>
      `,

            dpa: `
        <h1>Data Processing Agreement (DPA)</h1>
        <p><strong>Last Updated:</strong> [Insert Date]</p>

        <p>This Data Processing Agreement (“DPA”) forms part of the Master Service Agreement between
        <strong>Dream Weavers Edutrack Limited</strong> (“Data Processor”) and
        <strong>Paalm Paradise</strong> (“Data Controller”).</p>

        <h2>1. Purpose</h2>
        <p>This DPA governs the Processor's handling of Personal Data on behalf of the Controller.</p>

        <h2>2. Processing Obligations</h2>
        <ul>
          <li>Process data only on documented instructions.</li>
          <li>Ensure confidentiality of authorized personnel.</li>
          <li>Implement technical and organizational security measures.</li>
        </ul>

        <h2>3. Security Incidents</h2>
        <p>The Processor will notify the Controller without undue delay upon becoming aware of a Security Incident.</p>

        <p>Contact: <a href="mailto:info@dreamweaversgroup.co.in">info@dreamweaversgroup.co.in</a></p>
      `,

            terms_of_use: `
        <h1>Terms of Use for Paalm Paradise</h1>
        <p><strong>Last Updated:</strong> [Insert Date]</p>

        <p>These Terms of Use (“Agreement”) govern your use of the Paalm Paradise platform.</p>

        <h2>1. Account Registration</h2>
        <p>You must register for an account to access certain features. You are responsible for maintaining your password and account security.</p>

        <h2>2. License Grant</h2>
        <p>Dream Weavers Edutrack Limited grants you a non-transferable license to use the Platform for lawful purposes only.</p>

        <h2>3. Acceptable Use</h2>
        <ul>
          <li>Do not violate laws or intellectual property rights.</li>
          <li>Do not upload malicious or obscene content.</li>
          <li>Do not interfere with the Platform's functionality.</li>
        </ul>

        <h2>4. Termination</h2>
        <p>We may suspend or terminate your access if you breach these Terms.</p>

        <h2>5. Contact</h2>
        <p>For questions, reach us at: <a href="mailto:info@dreamweaversgroup.co.in">info@dreamweaversgroup.co.in</a></p>
      `
        })

        await appConfig.save()
        res.status(201).json({
            message: "AppConfig saved successfully!"
        })

    } catch (error) {
        next(error)
    }
}